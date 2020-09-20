function debounce(func, time) {
  let timer;
  return function () {
    clearTimeout(timer);
    timer = setTimeout(func, time);
  };
}

Vue.component("home-meta", {
  computed: {
    descIsHtml() {
      return this.$mewx.desc[0] === "<";
    },
  },
  template: `
    <div>
      <p class="title">{{$mewx.name}}</p>
      <p>{{$mewx.desc}}</p>
    </div>
  `,
});

Vue.component("auth-page", {
  template: `
    <div class="columns">
      <div class="column is-12 is-8-tablet">
        <component
          v-for="comp in $mewx.components.home"
          :is="comp"
        />
      </div>
      <div class="column is-12 is-4-tablet">
        <component
          v-for="comp in $mewx.components.auth"
          :is="comp"
        />
      </div>
    </div>
	`,
});

Vue.component("rooms-page", {
  data() {
    return {
      search: "",
      rooms: null,
      roomsFuse: null,
    };
  },
  created() {
    this.filter = debounce(
      function () {
        this.rooms = this.roomsFuse.search(this.search);
      }.bind(this),
      200
    );
  },
  methods: {
    goToRoom(room) {
      this.$router.push(`/room/${room.id}`);
    },
    createRoom: async function () {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: {
          Authorization: this.$root.apiToken,
        },
      });
      if (response.ok) {
        const body = await response.json();
        this.$router.push(`/room/${body.data.room.id}`);
      }
    },
    listRooms: async function () {
      const response = await fetch("/api/rooms");
      if (response.ok) {
        const body = await response.json();
        this.rooms = body.data.rooms;
        this.roomsFuse = new Fuse(body.data.rooms, {
          keys: ["name", "host_name"],
        });
      }
    },
  },
  mounted() {
    this.listRooms();
  },
  template: `
    <div class="card">
      <div class="card-header">Rooms</div>
      <div class="card-body">
        <div class="mewx-rooms">
          <div class="mewx-rooms-search">
            <input v-model="search" v-on:input="filter()" type="text" placeholder="Search..."/>
          </div>
          <div class="mewx-rooms-list">
            <table>
              <thead>
                <tr>
                  <td></td>
                  <td>Name</td>
                  <td>Host</td>
                  <td>Lobby</td>
                  <td>Mode</td>
                </tr>
              </thead>
              <tbody v-if="rooms">
                <tr class="mewx-rooms-list-item" v-on:click="goToRoom(room)" v-for="room in rooms">
                  <td>{{room.status}}</td>
                  <td>{{room.name}}</td>
                  <td>{{room.host_name}}</td>
                  <td>{{room.player_num}}/{{room.player_max}}</td>
                  <td>{{room.mode}}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="mewx-rooms-controls">
            <button class="button" v-on:click="listRooms">Refresh</button>
            <button class="button" v-on:click="createRoom">Create</button>
          </div>
        </div>
      </div>
    </div>
	`,
});

Vue.component("room-page", {
  template: `
	<p> room </p>
	`,
});

Vue.component("user-page", {
  template: `
	<p> user </p>
	`,
});

const router = new VueRouter({
  routes: [
    {
      path: "/",
      component: Vue.component("auth-page"),
    },
    {
      path: "/rooms",
      component: Vue.component("rooms-page"),
      meta: { requiresAuth: true },
    },
    {
      path: "/room/:roomId",
      component: Vue.component("room-page"),
      meta: { requiresAuth: true },
    },
    {
      path: "/user/:userId",
      component: Vue.component("user-page"),
      meta: { requiresAuth: true },
    },
  ],
});

router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const authenticated = Boolean(sessionStorage.getItem("token"));
  if (requiresAuth && !authenticated) {
    next("/");
  } else if (!requiresAuth && authenticated) {
    next("/rooms");
  } else {
    next();
  }
});

function loadScript(src) {
  return new Promise(function (resolve) {
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.onload = resolve;
    script.src = `/client/${src}`;
    document.querySelector("head").appendChild(script);
  });
}

function loadStyle(href) {
  return new Promise(function (resolve) {
    const style = document.createElement("link");
    style.rel = "stylesheet";
    style.href = href;
    script.onload = resolve;
    document.querySelector("head").appendChild(style);
  });
}

async function load() {
  const response = await fetch("/options");
  const mewx = await response.json();
  Vue.prototype.$mewx = mewx;

  const jsPromises = mewx.js.map(loadScript);
  const cssPromises = mewx.css.map(loadStyle);
  await Promise.all([...jsPromises, ...cssPromises]);

  let user = undefined;
  let token = undefined;

  if (sessionStorage.getItem("token")) {
    const tokenResponse = await fetch("/api/auth/token", {
      method: "POST",
      headers: {
        Authorization: sessionStorage.getItem("token"),
      },
    });
    if (tokenResponse.ok) {
      const body = await tokenResponse.json();
      user = body.data.user;
      token = body.data.token;
    } else {
      sessionStorage.removeItem("token");
    }
  }

  new Vue({
    router: router,
    data() {
      return {
        apiToken: token,
        user: user,
      };
    },
    watch: {
      apiToken(newToken) {
        sessionStorage.setItem("token", newToken);
        if (newToken) this.$router.push("/rooms");
        if (!newToken) this.$router.push("/");
      },
    },
    template: `
      <div class="mewx-background">
        <div class="mewx-application">
          <router-view />
          <div class="mewx-footer">
            <div class="mewx-footer-text">
              Developed by Young Jin Park | Contribute on Github
            </div>
          </div>
        </div>
      </div>
	`,
  }).$mount("#app");
}

load();
