const onChange = require('on-change');

const renderMessageForm = (state, el) => {
  if (state.valid) {
    el.input.classList.remove('is-invalid');
    el.feedbackForm.classList.remove('text-danger');
    el.feedbackForm.textContent = '';
  } else {
    el.input.classList.add('is-invalid');
    el.feedbackForm.classList.add('text-danger');
    el.feedbackForm.textContent = state.error;
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
      break;
  }
};

export default (state, elements) => {
  const watchedState = onChange(state, (path, value) => {
    console.log(path, value);
    switch (path) {
      case 'form.field':
        renderMessageForm(watchedState.form.field, elements);
        break;
      case 'form.status':
        statusSwitch(watchedState, elements);
        break;
      default:
        break;
    }
  });
  return watchedState;
};
