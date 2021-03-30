const onChange = require('on-change');
const yup = require('yup');
const axios = require('axios');

const messages = {
  empty: () => 'Поле не заполнено',
  invalid: () => 'Ссылка должна быть валидным URL',
  dublicate: () => 'RSS уже существует',
};

const validate = (value, listValues) => {
  const shema = yup
    .string()
    .trim()
    .required(messages.empty())
    .url(messages.invalid())
    .notOneOf(listValues, messages.dublicate());
  try {
    shema.validateSync(value);
    return null;
  } catch (error) {
    return error.message;
  }
};

const getResult = async (value) => {
  const response = await axios.get(value); // дописать
  console.log(response);
};

export default () => {
  const state = {
    form: {
      status: 'filling',
      values: [],
      error: null,
      valid: true,
    },
    error: null,
  };

  const watchedState = onChange(state, (path, value) => {}); //допилить рендер

  const form = document.querySelector('form');
  form.addEventListener('submit', async (e) => {
    const listValues = wathedState.form.values;
    e.preventDefault();
    const formData = new FormData(e.target);
    const value = formData.get('url');
    const error = validate(value, listValues);

    if (error) {
      watchedState.form = {
        error,
        valid: false,
      };
      return;
    }

    watchedState.form = {
      error,
      valid: true,
    };
    watchedState.form.values.push(value);
    try {
      watchedState.form.status = 'sending';
      watchedState.error = null;
      const result = await getResult(value); //поменять название
    } catch (error) {
      watchedState.form.status = 'failed';
      watchedState.form.values.pop();
      watchedState = error.message; //организовать обработку ошибок
    }
  });
};
