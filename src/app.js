import * as yup from 'yup';
import i18next from 'i18next';
import _ from 'lodash';
import render from './render.js';
import resources from './locales';
import validate from './validator.js';
import fetchData from './fetchData.js';
import parsingData from './parsingData.js';

const interval = 5000;

const touchElement = (viewState, currentId) => {
  const { posts } = viewState.uiState;
  posts.forEach((post) => {
    const { postId } = post;
    const item = post;
    if (postId === currentId) {
      item.visibility = 'shown';
    }
  });
};

const setId = (viewState) => (el) => {
  if (!el.id) {
    const id = _.uniqueId();
    el.id = id;
    viewState.uiState.posts.push({ postId: id, visibility: 'hidden' });
  }
  /* if (_.isUndefined(el.touched)) {
    el.touched = false;
  } */
  return el;
};

const addMetaData = (postsState, viewState) => {
  const state = postsState.map((data) => {
    const newPosts = data.items.map(setId(viewState));
    data.items = newPosts;
    return data;
  });
  return state;
};

const updateCollection = (responseRSS, loadedRSS) => {
  const mergedPosts = loadedRSS;
  const loadedlinks = mergedPosts.map(({ link }) => link);
  if (loadedlinks.includes(responseRSS.link)) {
    const index = loadedlinks.indexOf(responseRSS.link);
    const currentLoadedItems = mergedPosts[index].items;
    /* const currentLoadedLinks = currentLoadedItems.map(({ link }) => link); */
    const targetItems = responseRSS.items;
    const newItems = _.differenceBy(targetItems, currentLoadedItems, 'link');
    /* const newItems = targetItems.reduce((acc, v) => {
      const currentLink = v.link;
      if (!currentLoadedLinks.includes(currentLink)) acc.push(v);
      return acc;
    }, []); */
    mergedPosts[index].items.unshift(...newItems);
  } else mergedPosts.push(responseRSS);
  return mergedPosts;
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
          required: () => ({ key: 'form.messageAlert.empty' }),
          notOneOf: () => ({ key: 'form.messageAlert.dublicate' }),
        },

        string: {
          max: ({ max }) => ({ key: 'form.messageAlert.big', values: { max } }),
          url: () => ({ key: 'form.messageAlert.invalid' }),
        },
      });
    })
    .then(() => {
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
          feedback: {
            message: null,
            statusForm: 'valid',
          },
        },
        urls: [],
        posts: [],
        uiState: {
          posts: [],
          currentId: null,
        },
      };

      const viewState = render(state, elements, i18n);

      elements.postsField.addEventListener('click', (value) => {
        const { target } = value;
        const { id } = target.dataset;
        if (!_.isUndefined(id)) {
          touchElement(viewState, id);
          viewState.uiState.currentId = id;
        }
      });

      const { form } = elements;
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const listUrls = state.urls;
        const formData = new FormData(e.target);
        const responseUrl = formData.get('url');
        const message = validate(responseUrl, listUrls);
        if (message) {
          viewState.form.feedback = {
            message,
            statusForm: 'invalid',
          };
          return;
        }
        viewState.form.feedback = {
          message,
          statusForm: 'valid',
        };
        viewState.form.status = 'sending';
        fetchData(responseUrl)
          .then((response) => {
            const { posts } = state;
            const parsedPosts = parsingData(response);
            const updatedPosts = updateCollection(parsedPosts, posts);
            const composedPosts = addMetaData(updatedPosts, viewState);
            viewState.posts = composedPosts;
            viewState.urls.push(responseUrl);
            viewState.form.feedback = {
              message: 'networkAlert.success',
              statusForm: 'valid',
            };
            viewState.form.status = 'filling';
          })
          .then(() => {
            const eternal = () => {
              const { urls } = state;
              urls.forEach((url) => {
                fetchData(url).then((response) => {
                  const { posts } = state;
                  const parsedPosts = parsingData(response);
                  const updatedPosts = updateCollection(parsedPosts, posts);
                  const composedPosts = addMetaData(updatedPosts, viewState);
                  viewState.posts = composedPosts;
                });
              });
              setTimeout(eternal, interval);
            };
            setTimeout(eternal, interval);
          })
          .catch((error) => {
            if (error.message === 'parsererror') {
              viewState.form.feedback = {
                message: 'networkAlert.invalidRssUrl',
                statusForm: 'invalid',
              };
            } else {
              viewState.form.feedback = {
                message: 'networkAlert.networkError',
                statusForm: 'invalid',
              };
            }
            viewState.form.status = 'failed';
          });
      });
    });
};
