const onChange = require('on-change');

const createEl = (el) => document.createElement(`${el}`);

const renderPosts = (posts, el) => {
  el.feeds.innerHTML = '';
  const h2 = createEl('h2');
  h2.textContent = 'Фиды';
  const ul = createEl('ul');
  ul.classList.add('list-group', 'mb-5');
  el.feeds.append(h2, ul);
  const feeds = posts.map((item) => {
    const li = createEl('li');
    li.classList.add('list-group-item');
    const h3 = createEl('h3');
    h3.textContent = item.title.textContent;
    const p = createEl('p');
    p.textContent = item.description.textContent;
    li.append(h3, p);
    return li.outerHTML;
  });
  console.log(feeds.join(''));
  ul.innerHTML = feeds.join('');
};

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
    case 'failed':
      el.input.removeAttribute('readonly');
      el.button.removeAttribute('disabled');
      el.feedbackForm.classList.add('text-danger');
      el.feedbackForm.textContent = state.messageAlert;
      break;
    case 'rendering':
      el.feedbackForm.classList.add('text-success');
      el.feedbackForm.textContent = state.messageAlert;
      break; // прописать дефолт или поменять свитч
  }
};

export default (state, elements) => {
  const watchedState = onChange(state, (path, value) => {
    console.log(path, value);
    console.log(state);
    switch (path) {
      case 'form.field':
        renderMessageForm(watchedState.form.field, elements);
        break;
      case 'form.status':
        statusSwitch(watchedState, elements);
        break;
      case 'posts':
        renderPosts(state.posts, elements);
        break;
      default:
        break; // прописать дефолт или поменять свитч
    }
  });
  return watchedState;
};
