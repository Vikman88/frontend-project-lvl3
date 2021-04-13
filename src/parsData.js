import crc32 from 'crc-32';

const hashCode = (string) => {
  const hash = crc32.str(string);
  return hash;
};

const getChildElements = (el) => {
  const title = el.querySelector('title').textContent;
  const link = el.querySelector('link').textContent;
  const description = el.querySelector('description').textContent;
  const id = hashCode(title);
  const result = {
    title,
    link,
    description,
    id,
  };
  return result;
};

const parsData = (data) => {
  const itemsCollection = data.querySelectorAll('item');
  const items = Array.from(itemsCollection).reduce((acc, item) => {
    const childElements = getChildElements(item);
    childElements.touched = false;
    return [...acc, childElements];
  }, []);
  const result = { ...getChildElements(data), items };
  return result;
};

export default parsData;
