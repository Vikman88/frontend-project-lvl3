import onChange from 'on-change';
import renderContent from './renderContent.js';

const statusSwitch = (state, el, i18n) => {
  const { valid, message } = state.form.feedback;
  const { status } = state.form;

  if (valid === 'true') {
    el.feedbackForm.classList.remove('text-danger');
    el.feedbackForm.classList.add('text-success');
    el.feedbackForm.textContent = i18n.t(message);
  } else {
    el.feedbackForm.classList.add('text-danger');
    el.feedbackForm.textContent = i18n.t(message);
  }

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
  const view = onChange(state, (path) => {
    const simplePath = path.split('.')[0];
    switch (simplePath) {
      case 'form':
        statusSwitch(state, elements, i18n);
        break;
      case 'posts':
        renderContent(state, elements, i18n);
        break;
      case 'currentId':
        renderContent(state, elements, i18n);
        break;
      default:
        break;
    }
  });
  return view;
};
