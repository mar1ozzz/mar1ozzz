let app = getApp()
Page({
  data: {
    menuList: [{
        icon: 'people-fill',
        name: '用户管理',
        url: "/pages/admin/user-list/user-list"
      },
      /*
      {
        icon: 'community-fill',
        name: '用户反馈',
        url: "/pages/admin/feedback-list/feedback-list"
      },  {
        icon: 'pic-fill',
        name: '轮播图管理',
        url: "/pages/admin/swiper-list/swiper-list"
      },
     
      {
        icon: 'send',
        name: '分类管理',
        url: "/pages/admin/type-list/type-list"
      },
     
     
       {
        icon: 'service-fill',
        name: '菜单管理',
        url: "/pages/admin/menulist/menulist"
      }, 
      {
        icon: 'bag-fill',
        name: '菜品管理',
        url: "/pages/admin/product-list/product-list"
      },
      {
        icon: 'add-fill',
        name: '午餐统计',
        url: "/pages/admin/preorder-list/preorder-list"
      },
      {
        icon: 'add-fill',
        name: '外卖管理',
        url: "/pages/admin/order-list/order-list"
      },*/
    ] 
  },
  itemClickHandle(e) {
    let url = e.currentTarget.dataset.url
    app.$comm.navigateTo(url)
  }
})