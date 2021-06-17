export default (content) => {
  const parserXML = new DOMParser();
  const xmlData = parserXML.parseFromString(content, 'text/xml');

  if (xmlData.querySelector('parsererror')) {
    const error = new Error();
    error.response = 'parsererror';
    throw error;
  }

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

  return parsingData(xmlData);
};
