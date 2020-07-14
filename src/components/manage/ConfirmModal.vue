<template>
  <div
    class="modal"
    id="confirm_modal"
    ref="modal"
    tabindex="-1"
    role="dialog"
    aria-labelledby="exampleModalCenterTitle"
    aria-hidden="true"
    :data-result="result"
  >
    <div class="modal-dialog modal-dialog-centered" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title"></h5>
          <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body text-left" style="white-space: pre-wrap;">
        </div>
        <div class="modal-footer">
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import $ from 'jquery';

export default {
  data() {
    return {
      result: 0,
    };
  },
  mounted() {
    $(this.$refs.modal)
      .on('show.bs.modal', () => {
        this.result = 0;
        if ($(this.$refs.modal).find('input').length) {
          setTimeout(() => {
            $(this.$refs.modal).find('input').trigger('focus');
          }, 0);
        }
      })
      .on('keypress', 'input', (e) => {
        if (['Enter', 'NumpadEnter'].includes(e.code)) {
          $(this.$refs.modal).find('.modal-footer > button[data-action=1]').click();
        }
      });
    $(this.$refs.modal).on('click', '.modal-footer > button', (e) => {
      this.result = Number($(e.target).attr('data-action'));
      setTimeout(() => {
        $(this.$refs.modal).modal('hide');
      }, 0);
    });
  },
};
</script>
