import {
  composeResponseToXML,
  parsingData,
  addMeta,
  updateCollection,
  touchElement,
} from './utils.js';

const createRSSFields = (response, state, view, elements) => {
  const responseXML = composeResponseToXML(response);
  const parsedPosts = parsingData(responseXML);
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
