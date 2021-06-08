import parsingData from './parsingData.js';

const touchElement = (collection, currentId) => {
  collection.forEach((feed) => {
    feed.items.forEach((post) => {
      const { id } = post;
      const item = post;
      if (id === parseInt(currentId, 10)) item.touched = true;
    });
  });
};

const setId = (view) => (el) => {
  if (!el.id) {
    view.incId += 1;
    el.id = view.incId;
  }
  if (typeof el.touched === 'undefined') {
    el.touched = false;
  }
  return el;
};

const addMeta = (postsState, view) => {
  const state = postsState.map((data) => {
    const newPosts = data.items.map(setId(view));
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

const createRSSFields = (response, state, view, elements) => {
  const parsedPosts = parsingData(response);
  const posts = updateCollection(parsedPosts, state.posts);
  const mergedPosts = addMeta(posts, view);
  view.posts = mergedPosts;
  elements.postsField.addEventListener('click', (val) => {
    const { target } = val;
    const { id } = target.dataset;
    view.currentId = id;
    touchElement(view.posts, id);
  });
};

export default createRSSFields;
