Vue.component("auth-guest", {
  data() {
    return {
      name: "",
    };
  },
  methods: {
    submitForm: async function (e) {
      e.preventDefault();
      const response = await fetch("/api/auth/guest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: this.name }),
      });
      if (response.ok) {
        const body = await response.json();
        this.$root.user = body.data.user;
        this.$root.apiToken = body.data.token;
      }
    },
  },
  template: `
    <form v-on:submit="submitForm">
      <div class="card">
        <div class="card-header">Guest Auth</div>
        <div class="card-body">
          <p class="label">Username</p>
          <div class="field">
            <input v-model="name" />
          </div>
          <div class="field">
            <button v-on:click="submitForm" class="button">
              Submit
            </button>
          </div>
        </div>
      </div>
    </form>
  `,
});
