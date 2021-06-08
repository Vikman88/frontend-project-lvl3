export default (response) => {
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

  return parsingData(responseXML);
};
