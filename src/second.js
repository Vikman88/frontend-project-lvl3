const onChange = require('on-change');

const createEl = (el) => document.createElement(`${el}`);

const buildModalWindow = (content, el) => {
  const modalTitle = el.modalHead;
  modalTitle.firstChild.textContent = content.title.textContent;
  const modalDescription = el.modalBody;
  modalDescription.textContent = content.description.textContent;
  const modalLink = el.modalFooter;
  modalLink.querySelector('a').href = content.link.textContent;
};

const renderFields = (items, el) => {
  return items.reduce((acc, item) => {
    const liItems = createEl('li');
    const button = createEl('button');
    button.type = 'button';
    button.classList.add('btn', 'btn-primary', 'btn-sm');
    button.setAttribute('data-toggle', 'modal');
    button.setAttribute('data-target', '#modal');
    button.textContent = 'Просмотр'; // убрать в мессадж
    button.setAttribute('data-id', item.id);
    liItems.classList.add(
      'list-group-item',
      'd-flex',
      'justify-content-between',
      'align-items-start'
    );
    const a = createEl('a');
    a.href = item.link.textContent;
    if (item.touched) {
      buildModalWindow(item, el);
      a.classList.add('font-weight-normal');
    } else a.classList.add('font-weight-bold');
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.setAttribute('data-id', item.id);
    a.textContent = item.title.textContent;
    liItems.append(a, button);
    return [...acc, liItems];
  }, []);
};

const renderContent = (posts, el) => {
  el.feedsField.innerHTML = '';
  el.postsField.innerHTML = '';
  const h2Feeds = createEl('h2');
  const h2Posts = createEl('h2');
  h2Feeds.textContent = 'Фиды'; // убрать в мессадж
  h2Posts.textContent = 'Посты';
  const ulFeeds = createEl('ul');
  const ulPosts = createEl('ul');
  ulFeeds.classList.add('list-group', 'mb-5');
  ulPosts.classList.add('list-group');
  el.feedsField.append(h2Feeds, ulFeeds);
  el.postsField.append(h2Posts, ulPosts);
  posts.forEach((post) => {
    const li = createEl('li');
    li.classList.add('list-group-item');
    const h3 = createEl('h3');
    h3.textContent = post.title.textContent;
    const p = createEl('p');
    p.textContent = post.description.textContent;
    li.append(h3, p);
    ulFeeds.prepend(li);
    const renderedFields = renderFields(post.items, el);
    ulPosts.prepend(...renderedFields);
  });
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
      el.input.focus();
      break;
    case 'filling':
      el.input.removeAttribute('readonly');
      el.button.removeAttribute('disabled');
      break;
    case 'failed':
      el.input.removeAttribute('readonly');
      el.button.removeAttribute('disabled');
      el.feedbackForm.classList.add('text-danger');
      el.feedbackForm.textContent = state.networkAlert;
      break;
    case 'rendering':
      el.feedbackForm.classList.add('text-success');
      el.feedbackForm.textContent = state.networkAlert;
      el.input.value = '';
      break;
    default:
      throw Error(`Unknown form status: ${status}`);
  }
};

export default (state, elements) => {
  const watcherFn = {
    'form.field': () => renderMessageForm(state.form.field, elements),
    'form.status': () => statusSwitch(state, elements),
    posts: () => renderContent(state.posts, elements),
  };
  const watchedState = onChange(state, (path, value) => {
    console.log(path, value);
    console.log(state);
    if (watcherFn[path]) {
      watcherFn[path]();
    }
  });
  return watchedState;
};
