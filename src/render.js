import onChange from 'on-change';

const contentPaths = {
  button: 'field.posts.button',
  feeds: 'field.feeds.header',
  field: 'field.posts.header',
};

const createEl = (el) => document.createElement(`${el}`);

const findEl = (postsState, currentId) => postsState.flatMap((el) => el.items)
  .find((item) => item.id === currentId);

const buildModalWindow = (state, el) => {
  const { currentId } = state.uiState;
  const { posts } = state;
  const currentContent = findEl(posts, currentId);
  const modalTitle = el.modalHead;
  modalTitle.firstChild.textContent = currentContent.title;
  const modalDescription = el.modalBody;
  modalDescription.textContent = currentContent.description;
  const modalLink = el.modalFooter;
  modalLink.querySelector('a').href = currentContent.link;
};

const createFields = (posts, uiState, i18n) => posts.reduce((acc, item) => {
  const liItem = createEl('li');
  const button = createEl('button');
  button.type = 'button';
  button.classList.add('btn', 'btn-primary', 'btn-sm');
  button.setAttribute('data-toggle', 'modal');
  button.setAttribute('data-target', '#modal');
  button.textContent = i18n.t(contentPaths.button);
  button.setAttribute('data-id', item.id);
  liItem.classList.add(
    'list-group-item',
    'd-flex',
    'justify-content-between',
    'align-items-start',
  );
  const aEl = createEl('a');
  aEl.href = item.link;
  if (uiState.posts.has(item.id)) aEl.classList.add('font-weight-normal');
  else aEl.classList.add('fw-bold');
  aEl.target = '_blank';
  aEl.rel = 'noopener noreferrer';
  aEl.setAttribute('data-id', item.id);
  aEl.textContent = item.title;
  liItem.append(aEl, button);
  return [...acc, liItem];
}, []);

const renderContent = (state, el, i18n) => {
  const { posts } = state;
  const { uiState } = state;
  el.feedsField.innerHTML = '';
  el.postsField.innerHTML = '';
  const h2Feed = createEl('h2');
  const h2Post = createEl('h2');
  h2Feed.textContent = i18n.t(contentPaths.feeds);
  h2Post.textContent = i18n.t(contentPaths.field);
  const ulFeed = createEl('ul');
  const ulPost = createEl('ul');
  ulFeed.classList.add('list-group', 'mb-5');
  ulPost.classList.add('list-group');
  el.feedsField.append(h2Feed, ulFeed);
  el.postsField.append(h2Post, ulPost);
  posts.forEach((post) => {
    const li = createEl('li');
    li.classList.add('list-group-item');
    const h3 = createEl('h3');
    h3.textContent = post.title;
    const pEl = createEl('p');
    pEl.textContent = post.description;
    li.append(h3, pEl);
    ulFeed.prepend(li);
    const dataFields = createFields(post.items, uiState, i18n);
    ulPost.prepend(...dataFields);
  });
};

const switchStatus = (state, el, i18n) => {
  const { statusForm, message } = state.form.feedback;
  const { status } = state.form;

  if (statusForm === 'valid') {
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
    switch (path) {
      case 'form.feedback':
        switchStatus(state, elements, i18n);
        break;
      case 'form.status':
        switchStatus(state, elements, i18n);
        break;
      case 'posts':
        renderContent(state, elements, i18n);
        break;
      case 'uiState.currentId':
        renderContent(state, elements, i18n);
        buildModalWindow(state, elements);
        break;
      default:
        break;
    }
  });
  return view;
};
