import * as yup from 'yup';
import axios from 'axios';
import i18n from 'i18next';
import render from './second.js';
import resources from './assets';

const variables = {
  proxy: () => 'https://hexlet-allorigins.herokuapp.com/raw?url=',
  goodStatus: () => 200,
};
const alertPaths = {
  empty: () => 'form.messageAlert.empty',
  invalid: () => 'form.messageAlert.invalid',
  dublicate: () => 'form.messageAlert.dublicate',
  invalidRssUrl: () => 'networkAlert.invalidRssUrl',
  networkError: () => 'networkAlert.networkError',
  success: () => 'networkAlert.success',
};

const hashCode = (
  s // переписать функцию
) =>
  s.split('').reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);

const validate = (url, listUrls) => {
  const shema = yup.string().trim().required().url().notOneOf(listUrls);
  try {
    shema.validateSync(url);
    return null;
  } catch (error) {
    return error.message;
  }
};

const compaireData = (targetData, compairedData, state) => {
  const addedTitles = compairedData.map(({ title }) => title);
  if (addedTitles.includes(targetData.title)) {
    const findedIndexField = addedTitles.indexOf(targetData.title);
    console.log(findedIndexField);
    const findedField = compairedData[findedIndexField];
    console.log(findedField);
    const findedItems = findedField.items;
    console.log(findedItems);
    const findedIds = findedItems.map(({ id }) => id);
    console.log(findedIds);
    const targetItems = targetData.items;
    console.log(targetItems);
    const updatedItems = targetItems.reduce((acc, v) => {
      const currentId = v.id;
      if (!findedIds.includes(currentId)) acc.push(v);
      return acc;
    }, []);
    state[findedIndexField].items.unshift(...updatedItems);
  } else state.push(targetData);
};

const updateCollection = (collection, id) => {
  collection.forEach((feed) =>
    feed.items.forEach((post) => {
      if (post.id === parseInt(id)) post.touched = true;
    })
  );
};

const getChildElements = (el) => {
  const title = el.querySelector('title').textContent;
  const link = el.querySelector('link').textContent;
  const description = el.querySelector('description').textContent;
  const result = { title, link, description };
  return result;
};

const parsData = (data) => {
  const itemsCollection = data.querySelectorAll('item');
  const items = Array.from(itemsCollection).reduce((acc, item) => {
    const childElements = getChildElements(item);
    childElements.id = hashCode(childElements.title);
    childElements.touched = false;
    return [...acc, childElements];
  }, []);
  const result = { ...getChildElements(data), items };
  return result;
};

const getRequest = (url) => {
  const promise = axios
    .get(`${variables.proxy()}${encodeURIComponent(url)}`)
    .then((response) => response)
    .catch((error) => error);
  return promise;
};

const app = () => {
  i18n
    .init({
      lng: 'ru',
      debug: false,
      resources,
    })
    .then((t) => {
      yup.setLocale({
        mixed: {
          required: i18n.t(alertPaths.empty()),
          notOneOf: i18n.t(alertPaths.dublicate()),
        },
        string: {
          url: i18n.t(alertPaths.invalid()),
        },
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
            error: null,
            valid: true,
          },
        },
        posts: [],
        networkAlert: null,
        idPost: 0,
      };

      const watchedState = render(state, elements);

      const form = elements.form;
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const listUrls = state.form.urls;
        const formData = new FormData(e.target);
        const url = formData.get('url');
        const error = validate(url, listUrls);
        if (error) {
          watchedState.form.field = {
            error,
            valid: false,
          };
          return;
        }
        watchedState.form.field = {
          error,
          valid: true,
        };
        watchedState.networkAlert = null;
        watchedState.form.urls.push(url);
        watchedState.form.status = 'sending';
        getRequest(url).then((response) => {
          const { responseXML } = response.request;
          const status = response.status;
          if (!responseXML) {
            watchedState.networkAlert =
              status === variables.goodStatus()
                ? i18n.t(alertPaths.invalidRssUrl())
                : i18n.t(alertPaths.networkError());
            watchedState.form.status = 'failed';
            watchedState.form.urls.pop();
            return;
          }

          const parsedPosts = parsData(responseXML);
          compaireData(parsedPosts, state.posts, watchedState.posts);
          watchedState.networkAlert = i18n.t(alertPaths.success());
          watchedState.form.status = 'rendering';
          elements.postsField.addEventListener('click', (e) => {
            const { target } = e;
            const { id } = target.dataset;
            updateCollection(watchedState.posts, id);
          });
          /*       postItemsCollection.forEach((postItem) => {
        const link = postItem.querySelector('a');
        const button = postItem.querySelector('button');
        console.log(link);

        link.addEventListener('click', (e) => {
          e.preventDefault();
          const { target } = e;
          const { id } = target.dataset;
          changeCollection(watchedState.posts, id);
          console.log(state);
        });
      }); */
        });
        const rerender = (urls) =>
          urls.map((url) => {
            getRequest(url).then((response) => {
              const { responseXML } = response.request;
              const parsedPosts = parsData(responseXML);
              compaireData(parsedPosts, state.posts, watchedState.posts);
              console.log(parsedPosts);
            });
          });
        //const promise = Promise.all(promises);
        watchedState.form.status = 'filling';
        let timerId = setTimeout(function tick() {
          rerender(state.form.urls);
          //clearTimeout(timerId);
          timerId = setTimeout(tick, 5000); // (*)
        }, 5000);
        //clearTimeout(timerId);
        //??
      });
    });
};

export default app;
