const composeResponseToXML = (response) => {
  const parserXML = new DOMParser();
  const xmlContent = response.data.contents;
  const responseXML = parserXML.parseFromString(xmlContent, 'text/xml');

  if (responseXML.querySelector('parsererror')) throw new Error('parsererror');

  const parsingData = (data) => {
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
      const items = Array.from(itemsCollection).map(parsingData);
      return { ...result, items };
    }
    return result;
  };

return parsingData(responseXML)
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

const touchElement = (collection, currentId) => {
  collection.forEach((feed) => {
    feed.items.forEach((post) => {
      const { id } = post;
      const item = post;
      if (id === parseInt(currentId, 10)) item.touched = true;
    });
  });
};

export {
  composeResponseToXML,
  updateCollection,
  touchElement,
  addMeta,
};
