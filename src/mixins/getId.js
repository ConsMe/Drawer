export default {
  computed: {
    id() { return this.$store.state.id; },
  },
  methods: {
    getId() {
      this.$store.commit('incrementId');
      const { id } = this;
      return id;
    },
  },
};
