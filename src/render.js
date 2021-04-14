import onChange from 'on-change';
import renderContent from './renderContent.js';

const renderMessageForm = (state, el) => {
  if (state.valid) {
    el.feedbackForm.classList.remove('text-danger');
    el.feedbackForm.classList.add('text-success');
    el.feedbackForm.textContent = state.message;
  } else {
    el.feedbackForm.classList.add('text-danger');
    el.feedbackForm.textContent = state.message;
  }
};

const statusSwitch = (state, el) => {
  const { status } = state.form;
  switch (status) {
    case 'sending':
      el.input.setAttribute('readonly', true);
      el.button.setAttribute('disabled', true);
      break;
    case 'filling':
      el.input.removeAttribute('readonly');
      el.button.removeAttribute('disabled');
      el.input.value = '';
      el.input.classList.remove('is-invalid');
      el.input.focus();
      break;
    case 'failed':
      el.input.removeAttribute('readonly');
      el.button.removeAttribute('disabled');
      el.input.classList.add('is-invalid');
      el.input.focus();
      break;
    default:
      throw Error(`Unknown form status: ${status}`);
  }
};

export default (state, elements, i18n) => {
  const watcherFn = {
    'form.field': () => renderMessageForm(state.form.field, elements),
    'form.status': () => statusSwitch(state, elements),
    posts: () => renderContent(state, elements, i18n),
    currentId: () => renderContent(state, elements, i18n),
  };
  const watchedState = onChange(state, (path) => {
    const simplePath = path.split('.')[0];
    if (watcherFn[simplePath]) watcherFn[simplePath]();
    if (watcherFn[path]) watcherFn[path]();
  });
  return watchedState;
};
