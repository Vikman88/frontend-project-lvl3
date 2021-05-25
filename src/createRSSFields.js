import {
  toResponseXML,
  parsData,
  addMeta,
  updateCollection,
  touchElements,
} from './utils.js';

const createRSSFields = (response, state, view, elements) => {
  const responseXML = toResponseXML(response);
  const parsedPosts = parsData(responseXML);
  const posts = updateCollection(parsedPosts, state.posts);
  const mergedPosts = addMeta(posts, view);
  view.posts = mergedPosts;
  elements.postsField.addEventListener('click', (val) => {
    const { target } = val;
    const { id } = target.dataset;
    view.currentId = id;
    touchElements(view.posts, id);
  });
};

export default createRSSFields;
