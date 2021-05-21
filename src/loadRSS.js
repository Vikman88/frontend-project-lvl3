import { updateCollection, touchElements } from './utils.js';

const parsData = (data) => {
  const title = data.querySelector('title').textContent;
  const link = data.querySelector('link').textContent;
  const description = data.querySelector('description').textContent;
  const result = {
    title,
    link,
    description,
  };

  const itemsCollection = data.querySelectorAll('item');
  if (itemsCollection.length) {
    const items = Array.from(itemsCollection).map(parsData);
    return { ...result, items };
  }
  return result;
};

const loadRss = (response, state, watchedState, elements) => {
  const rss = response.querySelector('rss');
  if (!rss) return false;
  const parsedPosts = parsData(response);
  updateCollection(parsedPosts, state.posts, watchedState.posts);
  elements.postsField.addEventListener('click', (val) => {
    const { target } = val;
    const { id } = target.dataset;
    watchedState.currentId = id;
    touchElements(watchedState.posts, id);
  });
  return true;
};

export default loadRss;
