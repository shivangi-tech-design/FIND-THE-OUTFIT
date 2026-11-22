/**
 * FIND THE OUTFIT — User Session & Local Storage Helper
 */
'use strict';

const Session = {
  STORAGE_KEYS: {
    TOKEN: 'fash_token',
    USER_ID: 'fash_user_id',
    USERNAME: 'fash_user',
    DISPLAY_NAME: 'fash_display_name',
    AVATAR: 'fash_avatar'
  },

  setSession(data) {
    if (!data) return;
    if (data.token) {
      localStorage.setItem(this.STORAGE_KEYS.TOKEN, data.token);
      sessionStorage.setItem(this.STORAGE_KEYS.TOKEN, data.token);
    }
    if (data.user_id !== undefined && data.user_id !== null) {
      localStorage.setItem(this.STORAGE_KEYS.USER_ID, String(data.user_id));
      sessionStorage.setItem(this.STORAGE_KEYS.USER_ID, String(data.user_id));
    }
    if (data.username) {
      localStorage.setItem(this.STORAGE_KEYS.USERNAME, data.username);
      sessionStorage.setItem(this.STORAGE_KEYS.USERNAME, data.username);
    }
    if (data.display_name) {
      localStorage.setItem(this.STORAGE_KEYS.DISPLAY_NAME, data.display_name);
      sessionStorage.setItem(this.STORAGE_KEYS.DISPLAY_NAME, data.display_name);
    }
    if (data.avatar_url !== undefined && data.avatar_url !== null) {
      localStorage.setItem(this.STORAGE_KEYS.AVATAR, data.avatar_url);
      sessionStorage.setItem(this.STORAGE_KEYS.AVATAR, data.avatar_url);
    }
  },

  getUserId() {
    return localStorage.getItem(this.STORAGE_KEYS.USER_ID) ||
           sessionStorage.getItem(this.STORAGE_KEYS.USER_ID) ||
           null;
  },

  getUsername() {
    return localStorage.getItem(this.STORAGE_KEYS.USERNAME) ||
           sessionStorage.getItem(this.STORAGE_KEYS.USERNAME) ||
           null;
  },

  getDisplayName() {
    return localStorage.getItem(this.STORAGE_KEYS.DISPLAY_NAME) ||
           sessionStorage.getItem(this.STORAGE_KEYS.DISPLAY_NAME) ||
           this.getUsername() ||
           'Curator';
  },

  getAvatar() {
    return localStorage.getItem(this.STORAGE_KEYS.AVATAR) ||
           sessionStorage.getItem(this.STORAGE_KEYS.AVATAR) ||
           '';
  },

  getToken() {
    return localStorage.getItem(this.STORAGE_KEYS.TOKEN) ||
           sessionStorage.getItem(this.STORAGE_KEYS.TOKEN) ||
           null;
  },

  isLoggedIn() {
    const user = this.getUsername();
    const token = this.getToken();
    return Boolean(user && token);
  },

  getAuthHeaders(customHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...customHeaders
    };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

 getAuthHeaders(customHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...customHeaders
  };

  const token = Session.getToken();

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
},

async authFetch(url, options = {}) {
  const headers = Session.getAuthHeaders(options.headers || {});

  return fetch(url, {
    ...options,
    headers
  });
},

  clear() {
    Object.values(this.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  }
};

window.Session = Session;
