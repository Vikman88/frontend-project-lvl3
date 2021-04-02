const onChange = require('on-change');

const createEl = (el) => document.createElement(`${el}`);

const reducePosts = (acc, item) => {
  const liItems = createEl('li');
  const button = createEl('button');
  button.type = 'button';
  button.classList.add('btn', 'btn-primary', 'btn-sm');
  button.setAttribute('data-toggle', 'modal');
  button.setAttribute('data-target', '#modal');
  button.textContent = 'Просмотр';
  liItems.classList.add(
    'list-group-item',
    'd-flex',
    'justify-content-between',
    'align-items-start'
  );
  const a = createEl('a');
  a.href = item.link.textContent;
  a.classList.add('font-weight-bold');
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.textContent = item.title.textContent;
  liItems.append(a, button);
  return [...acc, liItems];
};

const renderContent = (posts, el) => {
  el.feeds.innerHTML = '';
  el.posts.innerHTML = '';
  const h2Feeds = createEl('h2');
  const h2Posts = createEl('h2');
  h2Feeds.textContent = 'Фиды';
  h2Posts.textContent = 'Посты';
  const ulFeeds = createEl('ul');
  const ulPosts = createEl('ul');
  ulFeeds.classList.add('list-group', 'mb-5');
  ulPosts.classList.add('list-group');
  el.feeds.append(h2Feeds, ulFeeds);
  el.posts.append(h2Posts, ulPosts);
  posts.forEach((post) => {
    const li = createEl('li');
    li.classList.add('list-group-item');
    const h3 = createEl('h3');
    h3.textContent = post.title.textContent;
    const p = createEl('p');
    p.textContent = post.description.textContent;
    li.append(h3, p);
    ulFeeds.prepend(li);
    const posts = post.items.reduce(reducePosts, []);
    ulPosts.prepend(...posts);
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
      break;
    case 'filling':
      el.input.removeAttribute('readonly');
      el.button.removeAttribute('disabled');
      el.input.focus();
      el.input.value = '';
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
        renderContent(state.posts, elements);
        break;
      default:
        break; // прописать дефолт или поменять свитч
    }
  });
  return watchedState;
};
