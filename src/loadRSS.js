import parsData from './parsData.js';
import { updateCollection, touchElements } from './utils.js';

const loadRss = (response, state, watchedState, elements) => {
  const parsedPosts = parsData(response);
  updateCollection(parsedPosts, state.posts, watchedState.posts);
  elements.postsField.addEventListener('click', (val) => {
    const { target } = val;
    const { id } = target.dataset;
    watchedState.currentId = id;
    touchElements(watchedState.posts, id);
  });
};

export default loadRss;
