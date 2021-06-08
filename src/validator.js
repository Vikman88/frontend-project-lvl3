import * as yup from 'yup';

const validate = (url, listUrls) => {
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
export default validate;
