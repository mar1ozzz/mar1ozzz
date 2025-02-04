import * as $db from './db.js'

//全局请求遮罩
var needLoadingRequestCount = 0;

function showFullScreenLoading() {
  if (needLoadingRequestCount === 0) {
    wx.showLoading({
      title: '加载中'
    })
  }
  needLoadingRequestCount++;
};

function tryHideFullScreenLoading() {
  needLoadingRequestCount--;
  if (needLoadingRequestCount === 0) {
    wx.hideLoading();
  }
};

const callFunction = function (name, $url, data = {}, option = {
  showLoading: true
}) {
  console.log(`调用云函数 ${name}.${$url}，参数：`, data)

  let isLogin = $db.get("userInfo") ? true : false
  data.isLogin = isLogin;

  if (option.showLoading) {
    showFullScreenLoading()
  }
  return new Promise((resolve, reject) => {
    let optionData = Object.assign(data, {
      $url
    })
    console.log('发送到云函数的完整数据：', optionData)
    
    wx.cloud.callFunction({
        name,
        data: optionData
      })
      .then(res => {
        console.log(`云函数 ${name}.${$url} 返回结果：`, res)
        if (option.showLoading) {
          tryHideFullScreenLoading()
        }
        if (res && res.result) {
          resolve(res.result)
        }
      })
      .catch(err => {
        console.error(`云函数 ${name}.${$url} 调用失败：`, err)
        if (option.showLoading) {
          tryHideFullScreenLoading()
        }
        reject(err)
      })
  })
}

/**
 * 用户的请求
 */
const userCallFunction = callFunction.bind(null, 'user')

//主页热门搜索
export const getIndexHotSearch = (data) => userCallFunction('getIndexHotSearch', data);
//主页轮播图
export const getIndexSwiper = (data) => userCallFunction('getIndexSwiper', data);
//主页商品分类菜单
export const getIndexMenu = (data) => userCallFunction('getIndexMenu', data);
//主页热门推荐商品
export const getIndexHotProduct = (data) => userCallFunction('getIndexHotProduct', data)
//搜索页面获取热门搜索
export const getSearchHotSearch = (data) => userCallFunction('getSearchHotSearch', data);
//搜索页面添加搜索
export const addSearchHot = (data) => userCallFunction('addSearchHot', data);
//商品筛选页面获取商品
export const getLikeProductList = (data) => userCallFunction('getLikeProductList', data);
//商品详情页面获取商品详情
export const getProductDetail = (data) => userCallFunction('getProductDetail', data);
//商品详情页面改变收藏状态
export const updateCollecting = (data) => userCallFunction('updateCollecting', data);
//分类页面获取分类
export const getClassifyMenu = (data) => userCallFunction('getClassifyMenu', data);
//分类页面分类下的商品
export const getClassifProduct = (data) => userCallFunction('getClassifProduct', data);
//用户页面登录
export const userLogin = (data) => userCallFunction('userLogin', data);

//用户查询
export const userQuery = (data) => userCallFunction('userQuery', data);

//用户注册
export const userAdd = (data) => userCallFunction('userAdd', data);

//用户更新
export const userUpdate = (data) => userCallFunction('userUpdate', data);

//获取用户地址
export const getUserAddress = (data) => userCallFunction('getUserAddress', data);
//添加用户地址
export const addUserAddress = (data) => userCallFunction('addUserAddress', data);
//修改用户地址
export const updateUserAddress = (data) => userCallFunction('updateUserAddress', data);
//用户删除地址
export const delUserAddress = (data) => userCallFunction('delUserAddress', data);
//修改用户默认地址
export const updateAddressDefault = (data) => userCallFunction('updateAddressDefault', data);
//获取用户默认地址
export const getUserAddressDefault = (data) => userCallFunction('getUserAddressDefault', data);
//用户充值
export const userRecharge = (data) => userCallFunction('userRecharge', data);
//用户购买
export const orderPay = (data) => userCallFunction('orderPay', data);
//检测商品库存
export const isStockAdequate = (data) => userCallFunction('isStockAdequate', data);
//添加反馈
export const addFeedback = (data) => userCallFunction('addFeedback', data);
//获取用户收藏的商品
export const getProductListByCollection = (data) => userCallFunction('getProductListByCollection', data);
//根据订单状态获取订单
export const getOrderListCompleted = (data) => userCallFunction('getOrderListCompleted', data);
//用户提交退货
export const userReturnGoods = (data) => userCallFunction('userReturnGoods', data);
//用户提交定餐
export const userPreorder = (data) => userCallFunction('userPreorder', data);
//用户就餐
export const userPreorderuse = (data) => userCallFunction('userPreorderuse', data);
//用户撤销定餐
export const userPreorderDelete = (data) => userCallFunction('userPreorderDelete', data);
//用户定餐查询
export const userPreorderQuery = (data) => userCallFunction('userPreorderQuery', data);
//用户菜单查询
export const userMenuQuery = (data) => userCallFunction('userMenuQuery', data);
//post列表页面获取post
export const getPostList = (data) => userCallFunction('getPostList', data);
//pos详情页面获取post
export const getPostDetail = (data) => userCallFunction('getPostDetail', data);
//pos页面获取comment
export const getPostComment = (data) => userCallFunction('getPostComment', data);
//增加关注
export const addWatch = (data) => userCallFunction('addWatch', data);
//获取是否关注
export const getWatch = (data) => userCallFunction('getWatch', data);

//获取我发的帖子
export const getMyPostList = (data) => userCallFunction('getMyPostList', data);

//获取我关注帖子
export const getMyWatchList = (data) => userCallFunction('getMyWatchList', data);

//获取我关注帖子
export const getMycommentList = (data) => userCallFunction('getMycommentList', data);

//帖子评分
export const setPostScore = (data) => userCallFunction('setPostScore', data);

//修改状态
export const setPostStatus = (data) => userCallFunction('setPostStatus', data);

//数据汇总
export const getPostAggreate = (data) => userCallFunction('getPostAggreate', data);


/**
 * 管理员接口
 */
const adminCallFunction = callFunction.bind(null, 'admin')
//用户页面注册
export const userReg = (data) => adminCallFunction('userReg', data);
//删除用户
export const userDelete = (data) => adminCallFunction('userDelete', data);
//确认用户
export const userConfirm = (data) => adminCallFunction('userConfirm', data);
//获取用户列表
export const getUserlist = (data) => adminCallFunction('getUserlist', data);
//撤销管理员
export const cancelAdmin = (data) => adminCallFunction('cancelAdmin', data);
//设置管理员
export const setAdmin = (data) => adminCallFunction('setAdmin', data);
//修改用户余额
export const updateUserMoney = (data) => adminCallFunction('updateUserMoney', data);
//获取轮播图
export const getSwiper = (data) => adminCallFunction('getSwiper', data);
//获取轮播图跳转选择项
export const getSwiperLinkOption = (data) => adminCallFunction('getSwiperLinkOption', data);
//添加轮播图
export const addSwiperAdmin = (data) => adminCallFunction('addSwiperAdmin', data);
//删除轮播图
export const delSwiperAdmin = (data) => adminCallFunction('delSwiperAdmin', data);
//修改轮播图
export const updateSwiperAdmin = (data) => adminCallFunction('updateSwiperAdmin', data);
//获取商品列表
export const getProductlistAdmin = (data) => adminCallFunction('getProductlistAdmin', data);
//获取商品分类
export const getClassifyAdmin = (data) => adminCallFunction('getClassifyAdmin', data);
//添加商品
export const addProductAdmin = (data) => adminCallFunction('addProductAdmin', data);
//删除商品
export const delProductAdmin = (data) => adminCallFunction('delProductAdmin', data);
//修改商品
export const updateProductAdmin = (data) => adminCallFunction('updateProductAdmin', data);
//获取用户反馈列表
export const getFeedbacklistAdmin = (data) => adminCallFunction('getFeedbacklistAdmin', data);
//获取用户订单
export const getOrderlistAdmin = (data) => adminCallFunction('getOrderlistAdmin', data);
//订单发货
export const updateDeliverGoods = (data) => adminCallFunction('updateDeliverGoods', data);
//订单退货
export const updateReturnGoods = (data) => adminCallFunction('updateReturnGoods', data);
//删除订单
export const delOrderAdmin = (data) => adminCallFunction('delOrderAdmin', data);
//已读反馈
export const updataFeedbackReadAdmin = (data) => adminCallFunction('updataFeedbackReadAdmin', data);
//获取分类列表
export const getTypelistAdmin = (data) => adminCallFunction('getTypelistAdmin', data);
//删除分类
export const delTypeAdmin = (data) => adminCallFunction('delTypeAdmin', data);
//增加分类
export const addTypeAdmin = (data) => adminCallFunction('addTypeAdmin', data);
//修改分类
export const updateTypeAdmin = (data) => adminCallFunction('updateTypeAdmin', data);

//订餐列表
export const preorderListAdmin = (data) => adminCallFunction('preorderListAdmin', data);



//增加菜单
export const menuAddAdmin = (data) => adminCallFunction('menuAddAdmin', data);



//删除菜单
export const menuDeleteAdmin = (data) => adminCallFunction('menuDeleteAdmin', data);

//修改菜单
export const menuUpdateAdmin = (data) => adminCallFunction('menuUpdateAdmin', data);

//增加菜单
export const menuListAdmin = (data) => adminCallFunction('menuListAdmin', data);

//订餐统计
export const preorderCountAdmin = (data) => adminCallFunction('preorderCountAdmin', data);

//生成统计文件
export const preDownloadAdmin = (data) => adminCallFunction('preDownload', data);

//下载统计文件
export const doDownloadAdmin = (data) => adminCallFunction('doDownload', data);
//发帖
export const addPostAdmin = (data) => adminCallFunction('addPostAdmin', data);


