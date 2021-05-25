import {
  toResponseXML,
  parsData,
  addMeta,
  updateCollection,
  touchElements,
} from './utils.js';

const createRSSFields = (response, state, watchedState, elements) => {
  const responseXML = toResponseXML(response);
  const parsedPosts = parsData(responseXML);
  const posts = updateCollection(parsedPosts, state.posts);
  const mergedPosts = addMeta(posts, watchedState);
  watchedState.posts = mergedPosts;
  elements.postsField.addEventListener('click', (val) => {
    const { target } = val;
    const { id } = target.dataset;
    watchedState.currentId = id;
    touchElements(watchedState.posts, id);
  });
};

export default createRSSFields;
