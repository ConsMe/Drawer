import $ from 'jquery';

export default (payload) => new Promise((resolve) => {
  const { body, actions, input } = payload;
  const { title } = payload;
  const confirmModal = $('#confirm_modal');
  $(confirmModal).find('.modal-body').text(body);
  $(confirmModal).find('.modal-title').text(title);
  const allActions = actions || [
    {
      action: '0',
      style: 'secondary',
      text: 'Нет',
    },
    {
      action: '1',
      style: 'primary',
      text: 'Да',
    },
  ];
  const buttons = allActions.map((action) => {
    const button = $('<button class="btn" type="button"></button>');
    $(button).attr('data-action', action.action).addClass(`btn-${action.style}`).text(action.text);
    return button;
  });
  $(confirmModal).find('.modal-footer').html(buttons);
  if (input) {
    const field = $(`<input id="data" type="${input.type}" placeholder="${input.placeholder}" />`);
    $(field).addClass('form-control mt-3');
    $(confirmModal).find('.modal-body').append(field);
  }
  $(confirmModal).modal('show').on('hide.bs.modal', (e) => {
    const result = $(e.target).attr('data-result');
    if (input && result === '1') {
      const data = $(confirmModal).find('#data').val();
      resolve(data);
    } else {
      resolve(result === '1');
    }
    $(confirmModal).off('hide.bs.modal');
  });
});
