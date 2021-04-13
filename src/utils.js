const toResponseXML = (response) => {
  const parserXML = new DOMParser();
  const xmlContent = response.data.contents;
  const responseXML = parserXML.parseFromString(xmlContent, 'text/xml');
  return responseXML;
};

const updateCollection = (responsePosts, loadedPosts, state) => {
  const loadedPostIds = loadedPosts.map(({ id }) => id);
  if (loadedPostIds.includes(responsePosts.id)) {
    const index = loadedPostIds.indexOf(responsePosts.id);
    const findedField = loadedPosts[index];
    const findedItems = findedField.items;
    const findedIds = findedItems.map(({ id }) => id);
    const targetItems = responsePosts.items;
    const updatedItems = targetItems.reduce((acc, v) => {
      const currentId = v.id;
      if (!findedIds.includes(currentId)) acc.push(v);
      return acc;
    }, []);
    state[index].items.unshift(...updatedItems);
  } else state.push(responsePosts);
};

const touchElements = (collection, currentId) => {
  collection.forEach((feed) => {
    feed.items.forEach((post) => {
      const { id } = post;
      const item = post;
      if (id === parseInt(currentId, 10)) item.touched = true;
    });
  });
};

export { toResponseXML, updateCollection, touchElements };
