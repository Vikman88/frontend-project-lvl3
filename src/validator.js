import * as yup from 'yup';

const validate = (url, listUrls) => {
  const shema = yup.string()
    .trim()
    .required()
    .url()
    .notOneOf(listUrls);
  try {
    shema.validateSync(url);
    return null;
  } catch (error) {
    return error.message;
  }
};
export default validate;
