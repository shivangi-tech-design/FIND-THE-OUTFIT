/**
 * ============================================================================
 * FIND THE OUTFIT — Real Curator Profile & Lookbook Controller
 * ============================================================================
 * Clean integration with C++ Crow & MySQL backend:
 * - Reads user profile from GET /api/users/<username>
 * - Reads user lookbook posts from GET /api/users/<username>/posts
 * - Awaits both before rendering
 * - Displays real counts, real bio, real avatar, and real posts
 * - Find Outfit visual similarity engine via POST /api/posts/<id>/find-outfit
 * - Real post creation via POST /api/posts
 * - XSS protection via input escaping
 */

'use strict';

/* ============================================================================
   1. State Management
   ============================================================================ */
const profileState = {
  activeProfileUser: null,
  viewerUser: null,
  posts: [],
  activeTab: 'lookbook',
  selectedFile: null,
  activeMatchPost: null,
  activeMatchRequest: null
};

/* ============================================================================
   2. DOM Elements Cache
   ============================================================================ */
const DOM = {
  breadcrumbCuratorName: document.getElementById('breadcrumbCuratorName'),
  profileMainAvatar: document.getElementById('profileMainAvatar'),
  profileDisplayName: document.getElementById('profileDisplayName'),
  profileVerifiedIcon: document.getElementById('profileVerifiedIcon'),
  profileDisplayHandle: document.getElementById('profileDisplayHandle'),
  profileDisplayNiche: document.getElementById('profileDisplayNiche'),
  profileDisplayLocation: document.getElementById('profileDisplayLocation'),
  profileDisplayBio: document.getElementById('profileDisplayBio'),
  profileAestheticTags: document.getElementById('profileAestheticTags'),
  profileActionsGroup: document.getElementById('profileActionsGroup'),

  profilePostsCount: document.getElementById('profilePostsCount'),
  profileFollowersCount: document.getElementById('profileFollowersCount'),
  profileFollowingCount: document.getElementById('profileFollowingCount'),
  profileSavedCount: document.getElementById('profileSavedCount'),
  tabLookbookCount: document.getElementById('tabLookbookCount'),
  tabSavedCount: document.getElementById('tabSavedCount'),

  profileTabs: document.querySelectorAll('.profile-tab-btn'),
  profilePostsGrid: document.getElementById('profilePostsGrid'),
  profileCollectionsContainer: document.getElementById('profileCollectionsContainer'),

  // Navbar user dropdown
  userMenuBtn: document.getElementById('userMenuBtn'),
  userDropdownMenu: document.getElementById('userDropdownMenu'),
  navbarAvatarImg: document.getElementById('navbarAvatarImg'),
  dropdownUserName: document.getElementById('dropdownUserName'),
  dropdownUserHandle: document.getElementById('dropdownUserHandle'),
  logoutActionBtn: document.getElementById('logoutActionBtn'),

  // Search
  searchInput: document.getElementById('searchInput'),
  searchClearBtn: document.getElementById('searchClearBtn'),
  searchResultsDropdown: document.getElementById('searchResultsDropdown'),
  searchResultsList: document.getElementById('searchResultsList'),

  // Notifications
  notificationBtn: document.getElementById('notificationBtn'),
  notificationDropdown: document.getElementById('notificationDropdown'),
  notificationCount: document.getElementById('notificationCount'),
  markAllReadBtn: document.getElementById('markAllReadBtn'),

  // Find Outfit Modal
  findOutfitModal: document.getElementById('findOutfitModal'),
  closeFindModalBtn: document.getElementById('closeFindModalBtn'),
  closeFindModalBottomBtn: document.getElementById('closeFindModalBottomBtn'),
  matchedSourceImg: document.getElementById('matchedSourceImg'),
  matchedSourceTitle: document.getElementById('matchedSourceTitle'),
  matchedSourceCurator: document.getElementById('matchedSourceCurator'),
  similarityCardsContainer: document.getElementById('similarityCardsContainer'),
  similarityMiniFilterChips: document.querySelectorAll('.filter-mini-chip'),
  saveMatchedLookBtn: document.getElementById('saveMatchedLookBtn'),

  // Create Post Modal
  createPostModal: document.getElementById('createPostModal'),
  headerCreatePostBtn: document.getElementById('headerCreatePostBtn'),
  closeCreateModalBtn: document.getElementById('closeCreateModalBtn'),
  cancelPostBtn: document.getElementById('cancelPostBtn'),
  createPostForm: document.getElementById('createPostForm'),
  outfitFileInput: document.getElementById('outfitFileInput'),
  uploadDropZone: document.getElementById('uploadDropZone'),
  uploadPrompt: document.getElementById('uploadPrompt'),
  uploadPreviewWrapper: document.getElementById('uploadPreviewWrapper'),
  imagePreview: document.getElementById('imagePreview'),
  changeImageBtn: document.getElementById('changeImageBtn'),
  removeImageBtn: document.getElementById('removeImageBtn'),
  uploadErrorMsg: document.getElementById('uploadErrorMsg'),
  postCaptionText: document.getElementById('postCaptionText'),
  captionCharCounter: document.getElementById('captionCharCounter'),
  captionQuickTags: document.getElementById('captionQuickTags'),
  postCategorySelect: document.getElementById('postCategorySelect'),
  publishPostBtn: document.getElementById('publishPostBtn'),

  toastContainer: document.getElementById('toastContainer')
};

/* ============================================================================
   3. Helpers & Sanitization
   ============================================================================ */
function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}

function formatCount(num) {
  num = Number(num) || 0;
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return num.toString();
}

function showToast(message, icon = '✦') {
  if (!DOM.toastContainer) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-text">${escapeHTML(message)}</span>`;
  DOM.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 320);
  }, 3200);
}

function getApiUrl(path) {
  const base = (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) || 'http://localhost:8080';
  return `${base}${path}`;
}

/* ============================================================================
   4. Navbar Synchronization
   ============================================================================ */
function syncNavbarUser() {
  const username = window.Session ? Session.getUsername() : (sessionStorage.getItem('fash_user') || localStorage.getItem('fash_user'));
  const displayName = window.Session ? Session.getDisplayName() : (username || 'Curator');
  const avatar = window.Session ? Session.getAvatar() : '';

  const defaultAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%23E8DFD8'/%3E%3Ccircle cx='20' cy='15' r='7' fill='%238A7E74'/%3E%3Cpath d='M8 35 c0-7 6-11 12-11 s12 4 12 11' fill='%238A7E74'/%3E%3C/svg%3E";

  if (DOM.navbarAvatarImg) {
    DOM.navbarAvatarImg.src = avatar || defaultAvatar;
    DOM.navbarAvatarImg.alt = displayName;
  }
  if (DOM.dropdownUserName) {
    DOM.dropdownUserName.textContent = displayName;
  }
  if (DOM.dropdownUserHandle) {
    DOM.dropdownUserHandle.textContent = `@${username || 'curator'}`;
  }
}

/* ============================================================================
   5. Profile Loading & Rendering
   ============================================================================ */
async function loadAndRenderProfile() {
  const params = new URLSearchParams(window.location.search);
  let targetUsername = params.get('user');

  // Fallback to currently logged-in user if ?user= not given
  if (!targetUsername) {
    targetUsername = window.Session ? Session.getUsername() : (sessionStorage.getItem('fash_user') || localStorage.getItem('fash_user'));
  }

  if (!targetUsername) {
    if (window.Session) Session.requireLogin();
    else window.location.href = 'login.html';
    return;
  }

  const viewerId = window.Session ? (Session.getUserId() || '0') : '0';

  // Show loading indicator in lookbook grid
  if (DOM.profilePostsGrid) {
    DOM.profilePostsGrid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 4rem 1.5rem; text-align: center; color: var(--text-taupe);">
        <div style="display:inline-block; width: 32px; height: 32px; border: 3px solid rgba(73,56,47,0.2); border-top-color: var(--btn-primary-bg); border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 1rem;"></div>
        <p style="font-family: var(--font-serif); font-size: 1.1rem; color: var(--text-espresso);">Curating Lookbook...</p>
      </div>
    `;
  }

  try {
    // 1. Fetch User Profile
    const profileRes = await fetch(getApiUrl(`/api/users/${encodeURIComponent(targetUsername)}?viewer_id=${encodeURIComponent(viewerId)}`));
    const profileData = await profileRes.json();

    if (!profileRes.ok || profileData.status !== 'success' || !profileData.user) {
      renderErrorState(`Curator @${escapeHTML(targetUsername)} could not be found.`);
      return;
    }

    const user = profileData.user;
    profileState.activeProfileUser = user;

    // 2. Fetch User Lookbook Posts
    const postsRes = await fetch(getApiUrl(`/api/users/${encodeURIComponent(targetUsername)}/posts?viewer_id=${encodeURIComponent(viewerId)}`));
    const postsData = await postsRes.json();

    let posts = [];
    if (postsRes.ok && postsData.status === 'success' && Array.isArray(postsData.posts)) {
      posts = postsData.posts.map(p => ({
        id: String(p.id),
        authorHandle: p.author?.handle || targetUsername,
        authorName: p.author?.name || user.display_name,
        image: p.image && !p.image.startsWith('http') ? getApiUrl(p.image) : p.image,
        category: p.category || 'Minimal',
        caption: p.caption || '',
        likes: p.likesCount || 0,
        isLiked: Boolean(p.isLiked),
        isSaved: Boolean(p.isSaved),
        comments: Array.isArray(p.comments) ? p.comments.length : 0,
        similarItems: p.similarItems || []
      }));
    }

    profileState.posts = posts;

    // 3. Render Profile Header
    renderProfileHeader(user);

    // 4. Render Lookbook Grid
    renderLookbookGrid();

  } catch (err) {
    console.error('[Profile] Loading failed:', err);
    renderErrorState('Unable to connect to the backend server. Please verify the service is running.');
  }
}

function renderErrorState(message) {
  if (DOM.profileDisplayName) DOM.profileDisplayName.textContent = 'Curator Not Found';
  if (DOM.profileDisplayHandle) DOM.profileDisplayHandle.textContent = '';
  if (DOM.profileDisplayBio) DOM.profileDisplayBio.textContent = message;
  if (DOM.profilePostsGrid) {
    DOM.profilePostsGrid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 4rem 1.5rem; text-align: center; background: var(--bg-card-cream); border: 1px dashed var(--border-subtle); border-radius: var(--radius-md);">
        <div style="font-size: 2rem; color: var(--accent-dusty-rose); margin-bottom: 0.5rem;">✦</div>
        <h3 style="font-family: var(--font-serif); font-size: 1.3rem; margin-bottom: 0.4rem; color: var(--text-espresso);">Lookbook Unavailable</h3>
        <p style="color: var(--text-taupe); font-size: 0.9rem; max-width: 420px; margin: 0 auto 1.5rem;">${escapeHTML(message)}</p>
        <a href="feed.html" class="btn btn-primary" style="display:inline-block; text-decoration:none;">Return to Discovery Feed</a>
      </div>
    `;
  }
}

function renderProfileHeader(user) {
  document.title = `${user.display_name} (@${user.username}) — FIND THE OUTFIT Lookbook`;

  if (DOM.breadcrumbCuratorName) DOM.breadcrumbCuratorName.textContent = user.display_name;
  if (DOM.profileMainAvatar) {
    DOM.profileMainAvatar.src = user.avatar_url || (window.APP_CONFIG?.DEFAULT_AVATAR || '');
    DOM.profileMainAvatar.alt = user.display_name;
  }
  if (DOM.profileDisplayName) DOM.profileDisplayName.textContent = user.display_name;
  if (DOM.profileDisplayHandle) DOM.profileDisplayHandle.textContent = `@${user.username}`;
  if (DOM.profileDisplayNiche) DOM.profileDisplayNiche.textContent = user.location || 'Curator Lookbook';
  if (DOM.profileDisplayLocation) DOM.profileDisplayLocation.textContent = user.location || 'Global';
  if (DOM.profileDisplayBio) DOM.profileDisplayBio.textContent = user.bio || 'Curator of timeless silhouettes and tailored styling.';
  if (DOM.profileVerifiedIcon) DOM.profileVerifiedIcon.style.display = 'none';

  // Aesthetic tags
  if (DOM.profileAestheticTags) {
    const tags = ['#Tailoring', '#Minimal', '#QuietLuxury', '#Editorial'];
    DOM.profileAestheticTags.innerHTML = tags.map(tag => `<span class="aesthetic-tag">${tag}</span>`).join('');
  }

  // Update counts
  if (DOM.profilePostsCount) DOM.profilePostsCount.textContent = user.posts_count || profileState.posts.length;
  if (DOM.tabLookbookCount) DOM.tabLookbookCount.textContent = user.posts_count || profileState.posts.length;
  if (DOM.profileFollowersCount) DOM.profileFollowersCount.textContent = formatCount(user.followers_count || 0);
  if (DOM.profileFollowingCount) DOM.profileFollowingCount.textContent = formatCount(user.following_count || 0);
  if (DOM.profileSavedCount) DOM.profileSavedCount.textContent = user.saved_count || 0;
  if (DOM.tabSavedCount) DOM.tabSavedCount.textContent = user.saved_count || 0;

  // Render Action buttons (Edit Profile vs Follow/Message)
  renderProfileActions(user);
}

function renderProfileActions(user) {
  if (!DOM.profileActionsGroup) return;

  const currentLoggedInUser = window.Session ? Session.getUsername() : (sessionStorage.getItem('fash_user') || localStorage.getItem('fash_user'));
  const isSelf = user.is_self || (currentLoggedInUser && currentLoggedInUser.toLowerCase() === user.username.toLowerCase());

  if (isSelf) {
    DOM.profileActionsGroup.innerHTML = `
      <button type="button" class="btn-profile-action secondary" id="btnEditProfile">Edit Profile</button>
      <button type="button" class="btn-profile-action primary" id="btnShareLookbook">Share Lookbook</button>
    `;

    document.getElementById('btnEditProfile').addEventListener('click', promptEditProfile);
    document.getElementById('btnShareLookbook').addEventListener('click', () => {
      navigator.clipboard.writeText(window.location.href)
        .then(() => showToast('Lookbook link copied to clipboard!', '🔗'))
        .catch(() => showToast('Lookbook ready to share', '🔗'));
    });
  } else {
    const isFollowing = Boolean(user.is_following);
    const btnClass = isFollowing ? 'btn-profile-action following' : 'btn-profile-action primary';
    const btnText = isFollowing ? 'Following' : 'Follow';

    DOM.profileActionsGroup.innerHTML = `
      <button type="button" class="${btnClass}" id="btnProfileFollowToggle">${btnText}</button>
      <button type="button" class="btn-profile-action secondary" id="btnProfileMessage">Message</button>
    `;

    document.getElementById('btnProfileFollowToggle').addEventListener('click', () => toggleFollowUser(user));
    document.getElementById('btnProfileMessage').addEventListener('click', () => {
      showToast(`Direct message dialogue with @${user.username} opened.`, '✉️');
    });
  }
}

async function promptEditProfile() {
  const currentBio = profileState.activeProfileUser.bio || '';
  const currentName = profileState.activeProfileUser.display_name || '';

  const newName = prompt('Enter your display name:', currentName);
  if (newName === null) return;

  const newBio = prompt('Enter your curator bio:', currentBio);
  if (newBio === null) return;

  const userId = window.Session ? Session.getUserId() : sessionStorage.getItem('fash_user_id');
  const username = window.Session ? Session.getUsername() : sessionStorage.getItem('fash_user');

  try {
    const res = await fetch(getApiUrl('/api/users/me'), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: Number(userId),
        username: username,
        display_name: newName.trim(),
        bio: newBio.trim()
      })
    });
    const data = await res.json();
    if (res.ok && data.status === 'success') {
      showToast('Profile updated successfully!', '✨');
      profileState.activeProfileUser.display_name = newName.trim();
      profileState.activeProfileUser.bio = newBio.trim();
      if (DOM.profileDisplayName) DOM.profileDisplayName.textContent = newName.trim();
      if (DOM.profileDisplayBio) DOM.profileDisplayBio.textContent = newBio.trim();
      if (window.Session) Session.setSession({ display_name: newName.trim() });
    } else {
      showToast(data.message || 'Could not update profile', '⚠️');
    }
  } catch (err) {
    showToast('Network error updating profile', '⚠️');
  }
}

async function toggleFollowUser(user) {
  const followerId = window.Session ? Session.getUserId() : sessionStorage.getItem('fash_user_id');
  if (!followerId) {
    showToast('Please log in to follow curators.', '🔒');
    return;
  }

  const btn = document.getElementById('btnProfileFollowToggle');
  try {
    const res = await (window.Session ? Session.authFetch : fetch)(getApiUrl(`/api/users/${encodeURIComponent(user.username)}/follow`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: Number(followerId) })
    });
    const data = await res.json();
    if (res.ok && data.status === 'success') {
      user.is_following = data.is_following;
      user.followers_count = data.followers_count;
      if (btn) {
        btn.className = data.is_following ? 'btn-profile-action following' : 'btn-profile-action primary';
        btn.textContent = data.is_following ? 'Following' : 'Follow';
      }
      if (DOM.profileFollowersCount) {
        DOM.profileFollowersCount.textContent = formatCount(data.followers_count);
      }
      showToast(data.is_following ? `Following @${user.username}!` : `Unfollowed @${user.username}`);
    } else {
      showToast(data.message || 'Follow request could not be processed', '⚠️');
    }
  } catch (err) {
    showToast('Network error toggling follow status', '⚠️');
  }
}

/* ============================================================================
   6. Lookbook Grid Renderer
   ============================================================================ */
function renderLookbookGrid() {
  if (!DOM.profilePostsGrid) return;

  const posts = profileState.posts;

  if (profileState.activeTab === 'collections') {
    return;
  }

  if (posts.length === 0) {
    const isSelf = profileState.activeProfileUser && profileState.activeProfileUser.is_self;
    DOM.profilePostsGrid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 4rem 1.5rem; text-align: center; background: var(--bg-card-cream); border: 1px dashed var(--border-subtle); border-radius: var(--radius-md);">
        <div style="font-size: 1.8rem; color: var(--accent-dusty-rose); margin-bottom: 0.5rem;">✦</div>
        <h3 style="font-family: var(--font-serif); font-size: 1.3rem; margin-bottom: 0.4rem; color: var(--text-espresso);">No Outfits Published Yet</h3>
        <p style="color: var(--text-taupe); font-size: 0.88rem; max-width: 400px; margin: 0 auto 1.5rem;">
          ${isSelf ? 'Share your latest outfit look, styling notes, and seasonal aesthetic.' : 'This curator has not posted any outfit looks yet.'}
        </p>
        ${isSelf ? '<button type="button" class="btn btn-primary" id="btnEmptyCreatePost">Share an Outfit</button>' : ''}
      </div>
    `;
    const btnEmpty = document.getElementById('btnEmptyCreatePost');
    if (btnEmpty) btnEmpty.addEventListener('click', openCreatePostModal);
    return;
  }

  DOM.profilePostsGrid.innerHTML = posts.map(post => `
    <div class="lookbook-item-card" data-post-id="${post.id}">
      <span class="lookbook-card-category">${escapeHTML(post.category)}</span>
      <img src="${escapeHTML(post.image)}" alt="${escapeHTML(post.caption)}" class="lookbook-img" loading="lazy">
      
      <!-- Hover Overlay -->
      <div class="lookbook-card-overlay">
        <p class="overlay-caption">${escapeHTML(post.caption)}</p>
        <div class="overlay-metrics-row">
          <div class="overlay-stats">
            <span>❤️ ${post.likes}</span>
            <span>💬 ${post.comments}</span>
          </div>
          <button type="button" class="btn-lookbook-find" data-post-id="${post.id}">
            <span>✨ Find Outfit</span>
          </button>
        </div>
      </div>
    </div>
  `).join('');

  // Attach "Find Outfit" handlers on lookbook items
  DOM.profilePostsGrid.querySelectorAll('.btn-lookbook-find').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const postId = btn.getAttribute('data-post-id');
      const found = posts.find(p => p.id === postId);
      if (found) openFindOutfitModal(found);
    });
  });
}

/* ============================================================================
   7. "Find Outfit" Visual Similarity Engine Modal
   ============================================================================ */
async function openFindOutfitModal(post) {
  if (!post) return;
  profileState.activeMatchPost = post;
  const requestId = Symbol('find-outfit-request');
  profileState.activeMatchRequest = requestId;

  DOM.matchedSourceImg.src = post.image;
  DOM.matchedSourceTitle.textContent = `${post.category} Ensemble • ${profileState.activeProfileUser.display_name}`;
  DOM.matchedSourceCurator.textContent = `Curated by @${profileState.activeProfileUser.username}`;

  // Reset mini filter chips
  DOM.similarityMiniFilterChips.forEach(c => {
    c.classList.toggle('active', c.getAttribute('data-match-filter') === 'all');
  });

  DOM.findOutfitModal.hidden = false;
  document.body.style.overflow = 'hidden';

  // Loading spinner
  DOM.similarityCardsContainer.innerHTML = `
    <div style="grid-column: 1 / -1; padding: 3rem 1.5rem; text-align: center; color: var(--text-taupe);">
      <div style="display:inline-block; width: 36px; height: 36px; border: 3px solid rgba(73,56,47,0.2); border-top-color: var(--btn-primary-bg); border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 1rem;"></div>
      <p style="font-family: var(--font-serif); font-size: 1.1rem; color: var(--text-espresso); margin-bottom: 0.3rem;">Scanning Outfit Details...</p>
      <p style="font-size: 0.85rem; color: var(--text-taupe);">Computing visual features against our luxury catalogue.</p>
    </div>
  `;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000);
  try {
    const res = await fetch(getApiUrl(`/api/posts/${post.id}/find-outfit`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal
    });
    const body = await res.text();
    let data;
    try {
      data = body ? JSON.parse(body) : {};
    } catch {
      throw new Error(`The matcher returned an unreadable response (HTTP ${res.status}).`);
    }
    if (profileState.activeMatchRequest !== requestId || DOM.findOutfitModal.hidden) return;

    if (res.ok && data.status === 'success' && Array.isArray(data.similarItems) && data.similarItems.length > 0) {
      renderSimilarityItems(data.similarItems.slice(0, 5));
    } else {
      const message = data.message || (res.ok
        ? 'No matching products were returned for this outfit.'
        : `The matcher request failed (HTTP ${res.status}).`);
      DOM.similarityCardsContainer.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 2.5rem; text-align: center; color: var(--text-taupe);">
          ${escapeHTML(message)}
        </div>
      `;
    }
  } catch (err) {
    console.error('Find Outfit request error:', err);
    if (profileState.activeMatchRequest !== requestId || DOM.findOutfitModal.hidden) return;
    const message = err.name === 'AbortError'
      ? 'Matching took too long. Please try again.'
      : (err.message || 'Could not retrieve visual matches. Please ensure the backend and matching engine are running.');
    DOM.similarityCardsContainer.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 2.5rem; text-align: center; color: var(--text-taupe);">
        ${escapeHTML(message)}
      </div>
    `;
  } finally {
    clearTimeout(timeoutId);
  }
}

function closeFindOutfitModal() {
  profileState.activeMatchRequest = null;
  DOM.findOutfitModal.hidden = true;
  document.body.style.overflow = '';
}

function renderSimilarityItems(items) {
  if (!DOM.similarityCardsContainer) return;

  DOM.similarityCardsContainer.innerHTML = items.map(item => {
    let imgSrc = item.image;
    if (imgSrc && !imgSrc.startsWith('http')) {
      imgSrc = getApiUrl(`/product-images/${imgSrc}`);
    }

    const shopUrl = item.url && item.url !== '#' ? item.url : '#';

    return `
      <div class="similar-item-card">
        <div class="similar-item-media">
          <span class="similarity-badge-pill">✨ ${escapeHTML(item.matchScore)} Visual Match</span>
          <img src="${escapeHTML(imgSrc)}" alt="${escapeHTML(item.name)}" class="similar-item-img" loading="lazy">
        </div>
        <div class="similar-item-body">
          <span class="similar-item-brand">${escapeHTML(item.brand)}</span>
          <h4 class="similar-item-name">${escapeHTML(item.name)}</h4>
          <div class="similar-item-meta-row">
            <span class="similar-item-price">${escapeHTML(item.price)}</span>
            <a href="${escapeHTML(shopUrl)}" target="_blank" rel="noopener noreferrer" class="btn-shop-similar" style="text-decoration:none; display:inline-block; text-align:center;">
              Shop Now &rarr;
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/* ============================================================================
   8. Create Post Modal Controller
   ============================================================================ */
function openCreatePostModal() {
  DOM.createPostModal.hidden = false;
  document.body.style.overflow = 'hidden';
  resetCreatePostForm();
}

function closeCreatePostModal() {
  DOM.createPostModal.hidden = true;
  document.body.style.overflow = '';
}

function resetCreatePostForm() {
  profileState.selectedFile = null;
  DOM.createPostForm.reset();
  DOM.uploadPreviewWrapper.hidden = true;
  DOM.uploadPrompt.style.display = 'flex';
  DOM.imagePreview.src = '';
  DOM.uploadErrorMsg.classList.remove('visible');
  DOM.uploadErrorMsg.textContent = '';
  DOM.captionCharCounter.textContent = '0 / 400';
  DOM.publishPostBtn.disabled = false;
  DOM.publishPostBtn.classList.remove('is-loading');
  if (DOM.outfitFileInput) DOM.outfitFileInput.value = '';
}

function handleFileSelection(file) {
  if (!file) return;

  if (!file.type.match(/^image\/(jpeg|png|webp|gif|jpg)$/i)) {
    DOM.uploadErrorMsg.textContent = 'Please choose a valid JPEG, PNG, or WebP image.';
    DOM.uploadErrorMsg.classList.add('visible');
    return;
  }

  if (file.size > 8 * 1024 * 1024) {
    DOM.uploadErrorMsg.textContent = 'Image size exceeds 8MB limit.';
    DOM.uploadErrorMsg.classList.add('visible');
    return;
  }

  DOM.uploadErrorMsg.classList.remove('visible');
  profileState.selectedFile = file;

  const reader = new FileReader();
  reader.onload = (e) => {
    DOM.imagePreview.src = e.target.result;
    DOM.uploadPreviewWrapper.hidden = false;
    DOM.uploadPrompt.style.display = 'none';
  };
  reader.readAsDataURL(file);
}

async function handleCreatePostSubmit(e) {
  e.preventDefault();

  if (!profileState.selectedFile) {
    DOM.uploadErrorMsg.textContent = 'Please select an outfit photograph from your device.';
    DOM.uploadErrorMsg.classList.add('visible');
    return;
  }

  const caption = DOM.postCaptionText.value.trim();
  if (!caption) {
    DOM.postCaptionText.focus();
    return;
  }

  const category = DOM.postCategorySelect.value || 'Minimal';
  const userId = window.Session ? Session.getUserId() : sessionStorage.getItem('fash_user_id');
  const username = window.Session ? Session.getUsername() : sessionStorage.getItem('fash_user');

  if (!userId || !username) {
    showToast('Please log in to publish an outfit post.', '🔒');
    return;
  }

  DOM.publishPostBtn.classList.add('is-loading');
  DOM.publishPostBtn.disabled = true;

  try {
    const res = await (window.Session ? Session.authFetch : fetch)(getApiUrl('/api/posts'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: Number(userId),
        username: username,
        caption: caption,
        category: category,
        image: DOM.imagePreview.src
      })
    });

    const data = await res.json();

    if (res.ok && data.status === 'success' && data.post) {
      showToast('Your outfit has been published to your lookbook!', '✨');
      closeCreatePostModal();

      // Prepend to posts list if viewing own profile
      if (profileState.activeProfileUser && profileState.activeProfileUser.is_self) {
        const created = data.post;
        profileState.posts.unshift({
          id: String(created.id),
          authorHandle: username,
          authorName: profileState.activeProfileUser.display_name,
          image: created.image.startsWith('http') ? created.image : getApiUrl(created.image),
          category: created.category,
          caption: created.caption,
          likes: 0,
          isLiked: false,
          isSaved: false,
          comments: 0,
          similarItems: []
        });
        profileState.activeProfileUser.posts_count = (profileState.activeProfileUser.posts_count || 0) + 1;
        if (DOM.profilePostsCount) DOM.profilePostsCount.textContent = profileState.activeProfileUser.posts_count;
        if (DOM.tabLookbookCount) DOM.tabLookbookCount.textContent = profileState.activeProfileUser.posts_count;
        renderLookbookGrid();
      }
    } else {
      DOM.uploadErrorMsg.textContent = data.message || 'Could not publish post.';
      DOM.uploadErrorMsg.classList.add('visible');
    }
  } catch (err) {
    console.error('Publish error:', err);
    DOM.uploadErrorMsg.textContent = 'Server connection error during upload.';
    DOM.uploadErrorMsg.classList.add('visible');
  } finally {
    DOM.publishPostBtn.classList.remove('is-loading');
    DOM.publishPostBtn.disabled = false;
  }
}

/* ============================================================================
   9. Curator Search
   ============================================================================ */
let searchDebounceTimer = null;

function handleSearchInput(e) {
  clearTimeout(searchDebounceTimer);
  const query = e.target.value.trim().replace(/^@/, '');

  if (DOM.searchClearBtn) DOM.searchClearBtn.hidden = !query;

  if (!query) {
    DOM.searchResultsDropdown.hidden = true;
    return;
  }

  searchDebounceTimer = setTimeout(async () => {
    try {
      const res = await fetch(getApiUrl(`/api/users/search?q=${encodeURIComponent(query)}`));
      const data = await res.json();
      if (res.ok && data.status === 'success' && Array.isArray(data.curators) && data.curators.length > 0) {
        DOM.searchResultsList.innerHTML = data.curators.map(c => `
          <li class="search-result-item" data-handle="${escapeHTML(c.handle)}">
            <img src="${escapeHTML(c.avatar || window.APP_CONFIG?.DEFAULT_AVATAR || '')}" alt="${escapeHTML(c.name)}" class="search-result-avatar">
            <div class="search-result-text">
              <span class="search-result-name">${escapeHTML(c.name)}</span>
              <span class="search-result-handle">@${escapeHTML(c.handle)} • ${formatCount(c.followers)} followers</span>
            </div>
          </li>
        `).join('');

        DOM.searchResultsDropdown.hidden = false;

        DOM.searchResultsList.querySelectorAll('.search-result-item').forEach(item => {
          item.addEventListener('click', () => {
            const handle = item.getAttribute('data-handle');
            window.location.href = `profile.html?user=${encodeURIComponent(handle)}`;
          });
        });
      } else {
        DOM.searchResultsDropdown.hidden = true;
      }
    } catch (err) {
      DOM.searchResultsDropdown.hidden = true;
    }
  }, 300);
}

/* ============================================================================
   10. Event Listeners Initialization
   ============================================================================ */
function initEventListeners() {
  // Tabs
  DOM.profileTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      DOM.profileTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const target = tab.getAttribute('data-tab');
      profileState.activeTab = target;

      if (target === 'collections') {
        DOM.profilePostsGrid.hidden = true;
        DOM.profileCollectionsContainer.hidden = false;
      } else {
        DOM.profilePostsGrid.hidden = false;
        DOM.profileCollectionsContainer.hidden = true;
        renderLookbookGrid();
      }
    });
  });

  // User menu dropdown toggle
  if (DOM.userMenuBtn) {
    DOM.userMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isExpanded = DOM.userMenuBtn.getAttribute('aria-expanded') === 'true';
      DOM.userMenuBtn.setAttribute('aria-expanded', !isExpanded);
      DOM.userDropdownMenu.hidden = isExpanded;
    });
  }

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (DOM.userDropdownMenu && !DOM.userDropdownMenu.contains(e.target) && !DOM.userMenuBtn.contains(e.target)) {
      DOM.userDropdownMenu.hidden = true;
      if (DOM.userMenuBtn) DOM.userMenuBtn.setAttribute('aria-expanded', 'false');
    }
    if (DOM.searchResultsDropdown && !DOM.searchResultsDropdown.contains(e.target)) {
      DOM.searchResultsDropdown.hidden = true;
    }
  });

  // Logout
  if (DOM.logoutActionBtn) {
    DOM.logoutActionBtn.addEventListener('click', () => {
      if (window.Session) Session.clear();
      sessionStorage.clear();
      localStorage.clear();
      window.location.href = 'login.html';
    });
  }

  // Search input
  if (DOM.searchInput) {
    DOM.searchInput.addEventListener('input', handleSearchInput);
  }
  if (DOM.searchClearBtn) {
    DOM.searchClearBtn.addEventListener('click', () => {
      DOM.searchInput.value = '';
      DOM.searchClearBtn.hidden = true;
      DOM.searchResultsDropdown.hidden = true;
      DOM.searchInput.focus();
    });
  }

  // Create post modal triggers
  if (DOM.headerCreatePostBtn) DOM.headerCreatePostBtn.addEventListener('click', openCreatePostModal);
  if (DOM.closeCreateModalBtn) DOM.closeCreateModalBtn.addEventListener('click', closeCreatePostModal);
  if (DOM.cancelPostBtn) DOM.cancelPostBtn.addEventListener('click', closeCreatePostModal);

  // File upload dropzone
  if (DOM.uploadDropZone && DOM.outfitFileInput) {
    DOM.uploadDropZone.addEventListener('click', () => DOM.outfitFileInput.click());
    DOM.outfitFileInput.addEventListener('change', (e) => handleFileSelection(e.target.files[0]));

    DOM.uploadDropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      DOM.uploadDropZone.classList.add('drag-active');
    });

    ['dragleave', 'dragend'].forEach(ev => {
      DOM.uploadDropZone.addEventListener(ev, () => DOM.uploadDropZone.classList.remove('drag-active'));
    });

    DOM.uploadDropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      DOM.uploadDropZone.classList.remove('drag-active');
      if (e.dataTransfer.files && e.dataTransfer.files.length) {
        handleFileSelection(e.dataTransfer.files[0]);
      }
    });
  }

  if (DOM.changeImageBtn && DOM.outfitFileInput) {
    DOM.changeImageBtn.addEventListener('click', () => DOM.outfitFileInput.click());
  }

  if (DOM.removeImageBtn) {
    DOM.removeImageBtn.addEventListener('click', () => {
      profileState.selectedFile = null;
      DOM.imagePreview.src = '';
      DOM.uploadPreviewWrapper.hidden = true;
      DOM.uploadPrompt.style.display = 'flex';
      if (DOM.outfitFileInput) DOM.outfitFileInput.value = '';
    });
  }

  // Caption counter
  if (DOM.postCaptionText) {
    DOM.postCaptionText.addEventListener('input', (e) => {
      if (DOM.captionCharCounter) {
        DOM.captionCharCounter.textContent = `${e.target.value.length} / 400`;
      }
    });
  }

  // Quick hashtag chips
  if (DOM.captionQuickTags) {
    DOM.captionQuickTags.querySelectorAll('.quick-tag-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const tag = chip.getAttribute('data-tag');
        if (DOM.postCaptionText) {
          const cur = DOM.postCaptionText.value;
          DOM.postCaptionText.value = cur ? `${cur} ${tag}` : tag;
          DOM.captionCharCounter.textContent = `${DOM.postCaptionText.value.length} / 400`;
          DOM.postCaptionText.focus();
        }
      });
    });
  }

  // Create post form submit
  if (DOM.createPostForm) {
    DOM.createPostForm.addEventListener('submit', handleCreatePostSubmit);
  }

  // Find Outfit Modal close
  if (DOM.closeFindModalBtn) DOM.closeFindModalBtn.addEventListener('click', closeFindOutfitModal);
  if (DOM.closeFindModalBottomBtn) DOM.closeFindModalBottomBtn.addEventListener('click', closeFindOutfitModal);
  if (DOM.saveMatchedLookBtn) {
    DOM.saveMatchedLookBtn.addEventListener('click', () => {
      showToast('Curated match list saved to your lookbook collection!', '✨');
      closeFindOutfitModal();
    });
  }

  // Escape key closes modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (DOM.createPostModal && !DOM.createPostModal.hidden) closeCreatePostModal();
      if (DOM.findOutfitModal && !DOM.findOutfitModal.hidden) closeFindOutfitModal();
    }
  });
}

/* ============================================================================
   11. Bootstrap
   ============================================================================ */
async function init() {
  syncNavbarUser();
  initEventListeners();
  await loadAndRenderProfile();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
