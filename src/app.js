import * as yup from 'yup';
import i18next from 'i18next';
import render from './render.js';
import resources from './locales';
import validate from './validator.js';
import getRequest from './sendRequest.js';
import { toResponseXML } from './utils.js';
import loadRss from './loadRSS.js';

const variables = {
  interval: () => 5000,
};

const alertPaths = {
  empty: () => 'form.messageAlert.empty',
  invalid: () => 'form.messageAlert.invalid',
  dublicate: () => 'form.messageAlert.dublicate',
  invalidRssUrl: () => 'networkAlert.invalidRssUrl',
  networkError: () => 'networkAlert.networkError',
  success: () => 'networkAlert.success',
};

export default () => {
  const i18n = i18next.createInstance();
  i18n
    .init({
      lng: 'ru',
      debug: false,
      resources,
    })
    .then(() => {
      yup.setLocale({
        mixed: {
          required: i18n.t(alertPaths.empty()),
          notOneOf: i18n.t(alertPaths.dublicate()),
        },
        string: {
          url: i18n.t(alertPaths.invalid()),
        },
      });
    });

  const elements = {
    input: document.querySelector('input'),
    form: document.querySelector('form'),
    feedbackForm: document.querySelector('.feedback'),
    button: document.querySelector('[type="submit"]'),
    feedsField: document.querySelector('.feeds'),
    postsField: document.querySelector('.posts'),
    modalHead: document.querySelector('.modal-header'),
    modalBody: document.querySelector('.modal-body'),
    modalFooter: document.querySelector('.modal-footer'),
  };

  const state = {
    form: {
      status: 'filling',
      urls: [],
      field: {
        message: null,
        valid: true,
      },
    },
    posts: [],
    currentId: null,
  };

  const watchedState = render(state, elements, i18n);

  const { form } = elements;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const listUrls = state.form.urls;
    const formData = new FormData(e.target);
    const responseUrl = formData.get('url');
    const message = validate(responseUrl, listUrls);
    if (message) {
      watchedState.form.field = {
        message,
        valid: false,
      };
      return;
    }
    watchedState.form.field = {
      message,
      valid: true,
    };
    watchedState.form.status = 'sending';
    getRequest(responseUrl)
      .then((response) => {
        const responseXML = toResponseXML(response);
        const rss = responseXML.querySelector('rss');
        if (!rss) throw new Error('Страница не найдена');
        watchedState.form.urls.push(responseUrl);
        watchedState.form.field = {
          message: i18n.t(alertPaths.success()),
          valid: true,
        };
        loadRss(responseXML, state, watchedState, elements);
        watchedState.form.status = 'filling';
      })
      .then(() => {
        const eternal = () => {
          const { urls } = state.form;
          urls.forEach((url) => {
            getRequest(url)
              .then((response) => {
                const responseXML = toResponseXML(response);
                loadRss(responseXML, state, watchedState, elements);
              });
          });
          setTimeout(eternal, variables.interval());
        };
        setTimeout(eternal, variables.interval());
      })
      .catch((errors) => {
        if (errors.message === 'Страница не найдена') {
          watchedState.form.field = {
            message: i18n.t(alertPaths.invalidRssUrl()),
            valid: false,
          };
        } else {
          watchedState.form.field = {
            message: i18n.t(alertPaths.networkError()),
            valid: false,
          };
        }
        watchedState.form.status = 'failed';
        watchedState.form.urls.pop();
      });
  });
};
