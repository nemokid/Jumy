import { hashValue, encryptText, decryptText, encryptFile, fileToArrayBuffer } from './crypto';

const API_BASE = '/api';

export async function checkUsername(username) {
  const usernameHash = await hashValue(username);
  const response = await fetch(`${API_BASE}/check-username`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernameHash })
  });
  return response.json();
}

export async function register(username, pin) {
  const usernameHash = await hashValue(username);
  const pinHash = await hashValue(pin);
  const response = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernameHash, pinHash })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Registration failed');
  }
  return { usernameHash, pinHash };
}

export async function login(username) {
  const usernameHash = await hashValue(username);
  const response = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernameHash })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }
  return { usernameHash };
}

export async function verifyPin(usernameHash, pin) {
  const pinHash = await hashValue(pin);
  const response = await fetch(`${API_BASE}/verify-pin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernameHash, pinHash })
  });
  const data = await response.json();
  return { ...data, pinHash };
}

export async function getInbox(usernameHash, fakeMode) {
  if (fakeMode) {
    return {
      messages: [{
        id: 0,
        sender: 'Jumy',
        content: 'Hi, nice for you to be here. We hope you enjoy the app.',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        hasAttachment: false
      }]
    };
  }
  
  const response = await fetch(`${API_BASE}/inbox`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernameHash })
  });
  const data = await response.json();
  
  // Decrypt messages client-side
  const decryptedMessages = await Promise.all(
    (data.messages || []).map(async (msg) => {
      let senderUsername = 'Unknown';
      if (msg.senderEncrypted) {
        try {
          senderUsername = await decryptText(msg.senderEncrypted, usernameHash);
        } catch (e) {
          console.error('Failed to decrypt sender:', e);
        }
      }
      
      return {
        ...msg,
        sender: senderUsername,
        content: await decryptText(msg.content, usernameHash)
      };
    })
  );
  
  return { messages: decryptedMessages };
}

export async function sendMessage(senderHash, senderUsername, recipientUsername, content, file, fakeMode) {
  if (fakeMode) {
    return { success: true, messageId: 0 };
  }
  
  const recipientHash = await hashValue(recipientUsername);
  
  // Encrypt content and sender username client-side
  const encryptedContent = await encryptText(content, recipientHash);
  const encryptedSender = await encryptText(senderUsername, recipientHash);
  
  // Handle file attachment if present
  let attachmentUrl = null;
  let attachmentName = null;
  let attachmentSize = null;
  
  if (file) {
    const fileBuffer = await fileToArrayBuffer(file);
    const encryptedFile = await encryptFile(fileBuffer, recipientHash);
    
    const uploadResponse = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: encryptedFile
    });
    
    if (!uploadResponse.ok) {
      throw new Error('File upload failed');
    }
    
    const uploadData = await uploadResponse.json();
    attachmentUrl = uploadData.url;
    attachmentName = file.name;
    attachmentSize = file.size;
  }
  
  const response = await fetch(`${API_BASE}/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      senderHash,
      senderEncrypted: encryptedSender,
      recipientHash,
      content: encryptedContent,
      attachmentUrl,
      attachmentName,
      attachmentSize
    })
  });
  
  return response.json();
}

export async function deleteMessage(usernameHash, messageId, fakeMode) {
  if (fakeMode) {
    return { success: true };
  }
  
  const response = await fetch(`${API_BASE}/delete-message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernameHash, messageId })
  });
  return response.json();
}

export async function changePin(usernameHash, oldPin, newPin, fakeMode) {
  if (fakeMode) {
    return { success: true };
  }
  
  const oldPinHash = await hashValue(oldPin);
  const newPinHash = await hashValue(newPin);
  const response = await fetch(`${API_BASE}/change-pin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernameHash, oldPinHash, newPinHash })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to change PIN');
  }
  return { newPinHash };
}

export async function wipeAccount(usernameHash, pin, fakeMode) {
  if (fakeMode) {
    return { success: true };
  }
  
  const pinHash = await hashValue(pin);
  const response = await fetch(`${API_BASE}/wipe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernameHash, pinHash })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to wipe account');
  }
  return response.json();
}

export { hashValue };
