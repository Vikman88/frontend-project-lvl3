import parsingData from './parsingData.js';

const touchElement = (state, currentId) => {
  const { posts } = state;
  posts.forEach((feed) => {
    feed.items.forEach((post) => {
      const { id } = post;
      const item = post;
      if (id === parseInt(currentId, 10)) {
        item.touched = true;
        state.currentItem = item;
      }
    });
  });
};

const setId = (watchedState) => (el) => {
  if (!el.id) {
    watchedState.incId += 1;
    el.id = watchedState.incId;
  }
  if (typeof el.touched === 'undefined') {
    el.touched = false;
  }
  return el;
};

const addMeta = (postsState, watchedState) => {
  const state = postsState.map((data) => {
    const newPosts = data.items.map(setId(watchedState));
    data.items = newPosts;
    return data;
  });
  return state;
};

const updateCollection = (responseRSS, loadedRSS) => {
  const newState = loadedRSS;
  const loadedlinks = newState.map(({ link }) => link);
  if (loadedlinks.includes(responseRSS.link)) {
    const index = loadedlinks.indexOf(responseRSS.link);
    const currentLoadedItems = newState[index].items;
    const currentLoadedLinks = currentLoadedItems.map(({ link }) => link);
    const targetItems = responseRSS.items;
    const newItems = targetItems.reduce((acc, v) => {
      const currentLink = v.link;
      if (!currentLoadedLinks.includes(currentLink)) acc.push(v);
      return acc;
    }, []);
    newState[index].items.unshift(...newItems);
  } else newState.push(responseRSS);
  return newState;
};

const renderRSSFields = (response, loadedPosts, watchedState, elements) => {
  const parsedPosts = parsingData(response);
  const posts = updateCollection(parsedPosts, loadedPosts);
  const mergedPosts = addMeta(posts, watchedState);
  watchedState.posts = mergedPosts;
  elements.postsField.addEventListener('click', (val) => {
    const { target } = val;
    const { id } = target.dataset;
    touchElement(watchedState, id);
    watchedState.currentId = id;
  });
};

export default renderRSSFields;
