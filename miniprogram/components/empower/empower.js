Component({
  properties: {
    buttonBgColor: {
      type: "String",
      value: "#fef2ced2"
    },
    buttonFontColor:{
      type: "String",
      value: "#000000"
    }
  },
  methods:{
    wxGetUserInfo(res) {
      this.triggerEvent('click', res)
    }
  }
})