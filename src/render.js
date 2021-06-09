import onChange from 'on-change';

const contentPaths = {
  button: 'field.posts.button',
  feeds: 'field.feeds.header',
  field: 'field.posts.header',
};

const createEl = (el) => document.createElement(`${el}`);

/* const findEl = (elements, currentId) => {
  let result = null;
  elements.forEach((element) => {
    const { items } = element;
    if (!result) result = items.find((item) => item.id === currentId);
  });
  return result;
}; */

const buildModalWindow = (state, el) => {
  const { currentItem } = state;
  const currentContent = currentItem;
  const modalTitle = el.modalHead;
  modalTitle.firstChild.textContent = currentContent.title;
  const modalDescription = el.modalBody;
  modalDescription.textContent = currentContent.description;
  const modalLink = el.modalFooter;
  modalLink.querySelector('a').href = currentContent.link;
};

const renderFields = (items, i18n) => items.reduce((acc, item) => {
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
  const a = createEl('a');
  a.href = item.link;
  if (item.touched) a.classList.add('font-weight-normal');
  else a.classList.add('font-weight-bold');
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.setAttribute('data-id', item.id);
  a.textContent = item.title;
  liItem.append(a, button);
  return [...acc, liItem];
}, []);

const renderContent = (state, el, i18n) => {
  const { posts } = state;
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
    const p = createEl('p');
    p.textContent = post.description;
    li.append(h3, p);
    ulFeed.prepend(li);
    const view = renderFields(post.items, i18n);
    ulPost.prepend(...view);
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
  const view = onChange(state, (path, value) => {
    console.log(path, value);
    const simplePath = path.split('.')[0];
    switch (simplePath) {
      case 'form':
        switchStatus(state, elements, i18n);
        break;
      case 'posts':
        renderContent(state, elements, i18n);
        break;
      case 'currentId':
        buildModalWindow(state, elements);
        break;
      default:
        break;
    }
  });
  return view;
};
