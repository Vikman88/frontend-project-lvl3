import * as yup from 'yup';

export default (url, listUrls) => {
  const shema = yup.string()
    .trim()
    .required()
    .max(1000)
    .url()
    .notOneOf(listUrls);
  try {
    shema.validateSync(url);
    return null;
  } catch (error) {
    return error.message.key;
  }
};
