/**
 * 用户页面接口
 */
const cloud = require('wx-server-sdk')
const TcbRouter = require('tcb-router');
var dayjs = require('dayjs');
const [
  STATE_ONE, //待发货
  STATE_TWO, //待收货
  STATE_THREE, //待退货
  STATE_FOUR, //退货
  STATE_FIVE //已收货
] = [1, 2, 3, 4, 5]
cloud.init({
  env: "my-shitang-6g0eza3895b2f93a"
})
let db = cloud.database()
const _ = db.command
const $ = db.command.aggregate
const {
  formateDate,
  isGender,
  FormatData
} = require('./comm/util');



exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  let {
    APPID,
    OPENID
  } = wxContext
  const app = new TcbRouter({
    event
  })
  let {
    isLogin = false
  } = event

  //主页热门推荐商品
  app.router('getIndexHotProduct', async (ctx, next) => {
    let {
      page,
      limit
    } = event
    let product = db.collection('product')
    let num = (page - 1) * limit;
    let pageSize = limit
    let {
      data
    } = await product.orderBy('product_sales', 'desc').skip(num).limit(pageSize).get()
    ctx.body = {
      code: 1,
      data,
      msg: "获取成功"
    }
  })

  //主页热门搜索
  app.router('getIndexHotSearch', async (ctx, next) => {
    let hotSearch = db.collection('hotSearch')
    let {
      data
    } = await hotSearch.orderBy('hot_search_num', 'desc').limit(6).get()
    ctx.body = {
      code: 1,
      data,
      msg: "获取成功"
    }
  })

  //主页轮播图
  app.router('getIndexSwiper', async (ctx, next) => {
    let swiper = db.collection('swiper')
    let productType = db.collection('productType')
    let {type}=event
    let weight=0
    if(type=='index'){
      weight=0
    }else{
      weight=1
    }
    let {
      data
    } = await swiper.where({
      swiper_weight:weight
    }).orderBy('swiper_weight', 'desc').get()
    await Promise.all(data.map(async item => {
      if (item.swiper_page_type == 'classify') {
        let {
          data
        } = await productType.doc(item.swiper_option).get()
        item.swiper_option = data.product_type_name
      }
    }))
    ctx.body = {
      code: 1,
      data,
      msg: "获取成功"
    }
  })

  //主页商品分类菜单
  app.router('getIndexMenu', async (ctx, next) => {
    let productType = db.collection('productType')
    let {
      data
    } = await productType.limit(8).get()
    ctx.body = {
      code: 1,
      data,
      msg: "获取成功"
    }
  })

  //搜索页面获取热门搜索
  app.router('getSearchHotSearch', async (ctx, next) => {
    let hotSearch = db.collection('hotSearch')
    let {
      data
    } = await hotSearch.orderBy('hot_search_num', 'desc').limit(10).get()
    ctx.body = {
      code: 1,
      data,
      msg: "获取成功"
    }
  })

  //搜索页面添加搜索
  app.router('addSearchHot', async (ctx, next) => {
    let {
      hot_search_text,
    } = event
    let hotSearch = db.collection('hotSearch')
    let {
      total
    } = await hotSearch.where({
      hot_search_text: hot_search_text
    }).count()
    if (total) {
      await hotSearch.where({
          hot_search_text: hot_search_text
        })
        .update({
          data: {
            hot_num: _.inc(1)
          }
        })
    } else {
      await hotSearch.add({
        data: {
          hot_search_text: hot_search_text,
          hot_search_time: new Date(),
          hot_num: 1
        }
      })
    }

    ctx.body = {
      code: 1,
      data: {},
      msg: "添加成功"
    }
  })

  //商品筛选页面获取商品
  app.router('getLikeProductList', async (ctx, next) => {
    let {
      page,
      limit,
      priceLike = '',
      salesLike = false,
      searchKey = '',
      product_type_name = ''
    } = event
    let product = db.collection('product')
    let num = (page - 1) * limit;
    let pageSize = limit

    let result = product
    if (priceLike == 'asc') {
      result = result.orderBy('product_price', 'asc')
    } else if (priceLike == 'desc') {
      result = result.orderBy('product_price', 'desc')
    }
    if (salesLike) {
      result = result.orderBy('product_sales', 'desc')
    }
    if (searchKey) {
      result = result.where({
        product_name: db.RegExp({
          regexp: searchKey,
          options: 'i'
        })
      })
    }
    if (product_type_name) {
      result = result.where({
        product_type: product_type_name
      })
    }
    let {
      data
    } = await result.skip(num).limit(pageSize).get()

    ctx.body = {
      code: 1,
      data,
      msg: "获取成功"
    }
  })

  //获取帖子列表
  app.router('getPostList', async (ctx, next) => {
    let {
      index,
      postTime,
      comment,
      watch,
      page,
      limit,
      priceLike = '',
      salesLike = false,
      searchKey = '',
      product_type_name = ''
    } = event
    let product = db.collection('post')
    let num = (page - 1) * limit;
    let pageSize = limit    
    let result = product 
    if(index==0){   
      result = result.orderBy('product_time', postTime)
      .orderBy('comment',comment)
      .orderBy('watch',watch)
  }

  if(index==1){     
      result = result .orderBy('comment',comment)
      .orderBy('product_time', postTime)     
      .orderBy('watch',watch)
  }
  
  if(index==2){    
      result = result  .orderBy('watch',watch)
      .orderBy('comment',comment)
      .orderBy('product_time', postTime) 
  }
  

    if (searchKey) {
      result = result.where({
        product_name: db.RegExp({
          regexp: searchKey,
          options: 'i'
        })
      })
    }
    if (product_type_name) {
      result = result.where({
        product_type: product_type_name
      })
    }
    let {
      data
    } = await result.where({
      title:_.neq(null)
    }).skip(num).limit(pageSize).get()

    ctx.body = {
      code: 1,
      data,
      msg: "获取成功"
    }
  })

//获取我发的帖子列表
app.router('getMyPostList', async (ctx, next) => {
  let {
    index,
    postTime,
    comment,
    watch,
    page,
    limit,    
    searchKey = '',
    product_type_name = ''
  } = event
  let product = db.collection('post')
  let num = (page - 1) * limit;
  let pageSize = limit    
  let result = product 
  if(index==0){   
    result = result.orderBy('product_time', postTime)
    .orderBy('comment',comment)
    .orderBy('watch',watch)
}

if(index==1){     
    result = result .orderBy('comment',comment)
    .orderBy('product_time', postTime)     
    .orderBy('watch',watch)
}

if(index==2){    
    result = result  .orderBy('watch',watch)
    .orderBy('comment',comment)
    .orderBy('product_time', postTime) 
}


  if (searchKey) {
    result = result.where({
      product_name: db.RegExp({
        regexp: searchKey,
        options: 'i'
      })
    })
  }
  if (product_type_name) {
    result = result.where({
      product_type: product_type_name
    })
  }
  let {
    data
  } = await result.where({
    title:_.neq(null),
    author_id:OPENID
  }).skip(num).limit(pageSize).get()

  ctx.body = {
    code: 1,
    data,
    msg: "获取成功"
  }
})


//获取我关注的帖子
app.router('getMyWatchList', async (ctx, next) => {
  let {
    username,
    index,
    postTime,
    comment,
    watch,
    page,
    limit,    
    searchKey = '',
    product_type_name = ''
  } = event
  let product = db.collection('post')
  let num = (page - 1) * limit;
  let pageSize = limit    
  let result = product 
  if(index==0){   
    result = result.orderBy('product_time', postTime)
    .orderBy('comment',comment)
    .orderBy('watch',watch)
}

if(index==1){     
    result = result .orderBy('comment',comment)
    .orderBy('product_time', postTime)     
    .orderBy('watch',watch)
}

if(index==2){    
    result = result  .orderBy('watch',watch)
    .orderBy('comment',comment)
    .orderBy('product_time', postTime) 
}


  if (searchKey) {
    result = result.where({
      product_name: db.RegExp({
        regexp: searchKey,
        options: 'i'
      })
    })
  }
  if (product_type_name) {
    result = result.where({
      product_type: product_type_name
    })
  }
  let {
    data
  } = await result.where({
    watcherList: _.elemMatch(_.eq(username))
     }).skip(num).limit(pageSize).get()

  ctx.body = {
    code: 1,
    data,
    msg: "获取成功"
  }
})


//获取我回复的帖子

app.router('getMycommentList', async (ctx, next) => {
  let {
    index,
    postTime,
    comment,
    watch,
    page,
    limit,    
    searchKey = '',
    product_type_name = ''
  } = event
  let product = db.collection('post')
  let num = (page - 1) * limit;
  let pageSize = limit    
  let result = product 
  if(index==0){   
    result = result.orderBy('product_time', postTime)
    .orderBy('comment',comment)
    .orderBy('watch',watch)
}

if(index==1){     
    result = result .orderBy('comment',comment)
    .orderBy('product_time', postTime)     
    .orderBy('watch',watch)
}

if(index==2){    
    result = result  .orderBy('watch',watch)
    .orderBy('comment',comment)
    .orderBy('product_time', postTime) 
}


  if (searchKey) {
    result = result.where({
      product_name: db.RegExp({
        regexp: searchKey,
        options: 'i'
      })
    })
  }
  if (product_type_name) {
    result = result.where({
      product_type: product_type_name
    })
  }
  let {
    data
  } = await result.where({
    'commentList.author_id': _.eq(OPENID)
     }).skip(num).limit(pageSize).get()

  ctx.body = {
    code: 1,
    data,
    msg: "获取成功"
  }
})


//设置帖子得分setPostScore
app.router('setPostScore',async(ctx,next)=>{
  let {
    id,
    score,
    scoreComment,
    product_img_list,
    author_belong,
    author
  } = event
  let post = db.collection('post')
  let updated=await post.where({
   _id: id
  })
  .update({
    data:{
    score: score,
    commentList:_.push({ 
      each:[{ 
        score: score,    
        author,
        author_belong,
        经度,
        纬度,
        当前状态,
        content:scoreComment,
        product_img_list,
        product_time: formateDate(new Date(),'s')
      }],
      position:0
    }
    )
    }
  })


  if(updated){
    ctx.body = {
      code: 1,
      msg: "评分成功",        
    }
  }else{
    ctx.body = {
      code: 0,
      msg: "评分失败",        
    }
  }
})

//按类型汇总帖子

app.router('getPostAggreate', async (ctx, next) => {
 
  let data  = await db.collection('post')
  .aggregate()
  .group({
    // 按 category 字段分组
    _id: '$type',
    // 每组有一个 avgSales 字段，其值是组内所有记录的 sales 字段的平均值
    '发帖数': $.sum(1),
    '评星数':$.sum($.cond({
        if: $.gte(['$score', 1]),
        then: 1,
        else: 0
    }))
  })
  .end()
  ctx.body = {
    code: 1,
    data,
    msg: "获取成功"
  }
})


  //分类页面获取分类
  app.router('getClassifyMenu', async (ctx, next) => {
    let productType = db.collection('productType')
    let {
      data
    } = await productType.get()
    ctx.body = {
      code: 1,
      data,
      msg: "获取成功"
    }
  })

  //分类页面分类下的商品
  app.router('getClassifProduct', async (ctx, next) => {
    let {
      page,
      limit,
      product_type
    } = event
    let product = db.collection('product')
    let num = (page - 1) * limit;
    let pageSize = limit
    let {
      data
    } = await product.where({
      product_type: product_type
    }).skip(num).limit(pageSize).get()
    ctx.body = {
      code: 1,
      data,
      msg: "获取成功"
    }
  })

  //商品详情页面获取商品详情  
  app.router("getPostDetail", async (ctx, next) => {
    let {
      id
    } = event
    let post = db.collection('post')  
    let {
      data
    } = await post.where({
      _id:id
    }).get() 

    ctx.body = {
      code: 1,
      msg: "获取成功",
      data: FormatData(data, {
        product_time: "product_time"
      })
    }
  })


  app.router("getPostComment", async (ctx, next) => {
    let {
      id
    } = event
    let post = db.collection('post')  
    let {
      data
    } = await post.where({
      parentId:id
    }).get() 

    ctx.body = {
      code: 1,
      msg: "获取成功",
      data: FormatData(data, {
        product_time: "product_time"
      })
    }
  })

  //商品详情页面改变收藏状态
  app.router("updateCollecting", async (ctx, next) => {
    let {
      productId
    } = event
    let collection = db.collection('collection')
    let {
      total
    } = await collection.where({
      OPENID: OPENID,
      productId: productId
    }).count()
    if (total) {
      await collection.where({
        OPENID: OPENID,
        productId: productId
      }).remove()
      ctx.body = {
        code: 2,
        data: "取消点赞成功"
      }
    } else {
      await collection.add({
        data: {
          OPENID: OPENID,
          productId: productId
        }
      })
      ctx.body = {
        code: 1,
        data: "点赞成功"
      }
    }
  })

  //用户查询
  app.router('userQuery',async(ctx,next)=>{
    let user = db.collection('user')
    let {
      data
    } = await user.where({
      OPENID: OPENID
    }).get()
    if(data.length>0){
      ctx.body = {
        code: 1,
        msg: "用户查询成功",
        data: data[0]
      }}else{
        ctx.body = {
          code: 0,
          msg: "用户未注册"           
      }
    }
  })
  //用户更新
  app.router('userUpdate',async(ctx,next)=>{
    let {
      userInfo
    } = event
    let user = db.collection('user')
    let updated=await user.where({
      OPENID: OPENID
    })
    .update({
      data: userInfo
    })
    if(updated){
      ctx.body = {
        code: 1,
        msg: "用户信息修改成功",        
      }
    }else{
      ctx.body = {
        code: 0,
        msg: "用户信息修改失败",        
      }
    }
  })

  //用户注册
  app.router('userAdd',async(ctx,next)=>{
    let {
      userInfo
    } = event
    let contact=db.collection('contact')
    let{total}=await contact.where({
      name:_.eq(userInfo.username),
      phone:_.eq(parseInt(userInfo.phone))
    }).count()

    let user = db.collection('user')
    let usercount={total:1}
    usercount=await user.where({      
      phone:userInfo.phone
    }).count()    
    let {_id}={id:0}
    if(total>0&&usercount.total==0){
   
     _id=await user.add({
      data: {
        nickName: userInfo.nickName,
        gender: userInfo.gender,
        avatarUrl: userInfo.avatarUrl,
        OPENID: OPENID,
        money: 0,
        isAdmin: false,
        phone: userInfo.phone,
        username:userInfo.username,
        isGrant: 'false',
        realName: '测试',
        shopname: '',
        shopId: '',
        quxian: userInfo.quxian
      }
    })}
    if(_id){
      ctx.body = {
        code: 1,
        msg: "用户注册成功",
        data:userInfo        
      }
    }else{
      ctx.body = {
        code: 0,
        msg: "用户注册失败", 
        data:total               
      }
    }
  })

  //用户页面登录
  app.router('userLogin', async (ctx, next) => {
    let {
      userInfo
    } = event
    let user = db.collection('user')
    let {
      total
    } = await user.where({
      OPENID: OPENID
    }).count()
    //userInfo.gender = isGender(userInfo.gender)
    if (total) {
      await user.where({
          OPENID: OPENID
        })
        .update({
          data: userInfo
        })
    } else {
      await user.add({
        data: {
          nickName: userInfo.nickName,
          gender: userInfo.gender,
          avatarUrl: userInfo.avatarUrl,
          OPENID: OPENID,
          money: 0,
          isAdmin: false,
          phone: '',
          isGrant: 'false',
          realName: '测试',
          shopname: '',
          shopId: '',
          quxian: ''
        }
      })
    }
    let {
      data
    } = await user.where({
      OPENID: OPENID
    }).get()
    if (data[0].isGrant == "true") {
      ctx.body = {
        code: 1,
        msg: "登录成功",
        data: data[0]
      }
    } else {
      ctx.body = {
        code: 2,
        msg: "请完善资料，等待审核",
      }
    }
  })

  //获取用户地址
  app.router('getUserAddress', async (ctx, next) => {
    let address = db.collection('address')

    let {
      data
    } = await address.where({
      OPENID
    }).get()

    ctx.body = {
      code: 1,
      data,
      msg: "获取成功"
    }
  })

  //获取用户默认地址
  app.router('getUserAddressDefault', async (ctx, next) => {
    let address = db.collection('address')

    let {
      data
    } = await address.where({
      OPENID: OPENID,
      address_default: true
    }).get()

    ctx.body = {
      code: 1,
      data: data,
      msg: "获取成功"
    }
  })

  //添加用户地址
  app.router('addUserAddress', async (ctx, next) => {
    let {
      address_name,
      address_tel,
      address_province,
      address_city,
      address_district,
      address_info,
      address_default
    } = event
    let address = db.collection('address')

    if (address_default) {
      await address.where({
        OPENID: OPENID
      }).update({
        data: {
          address_default: false
        }
      })
    }

    await address.add({
      data: {
        OPENID: OPENID,
        address_name,
        address_tel,
        address_province,
        address_city,
        address_district,
        address_info,
        address_default
      }
    })

    ctx.body = {
      code: 1,
      data: {},
      msg: "添加成功"
    }
  })

  //修改用户地址
  app.router("updateUserAddress", async (ctx, next) => {
    let {
      address_name,
      address_tel,
      address_province,
      address_city,
      address_district,
      address_info,
      address_default,
      addressId
    } = event
    let address = db.collection('address')

    if (address_default) {
      await address.where({
        OPENID: OPENID
      }).update({
        data: {
          address_default: false
        }
      })
    }

    await address.where({
      OPENID: OPENID,
      _id: addressId
    }).update({
      data: {
        address_name,
        address_tel,
        address_province,
        address_city,
        address_district,
        address_info,
        address_default,
      }
    })
    ctx.body = {
      code: 1,
      msg: "修改成功",
      data: ''
    }
  })

  //用户删除地址
  app.router('delUserAddress', async (ctx, next) => {
    let {
      addressId
    } = event
    let address = db.collection('address')

    await address.where({
      OPENID: OPENID,
      _id: addressId
    }).remove()

    ctx.body = {
      code: 1,
      msg: "删除成功",
      data: ''
    }
  })

  //修改用户默认地址
  app.router("updateAddressDefault", async (ctx, next) => {
    let {
      addressId
    } = event
    let address = db.collection('address')

    await address.where({
      OPENID: OPENID
    }).update({
      data: {
        address_default: false
      }
    })

    await address.where({
      OPENID: OPENID,
      _id: addressId
    }).update({
      data: {
        address_default: true
      }
    })

    ctx.body = {
      code: 1,
      msg: "修改成功",
      data: ''
    }
  })

  //用户充值
  app.router("userRecharge", async (ctx, next) => {
    let {
      money
    } = event
    let user = db.collection('user')

    await user.where({
      OPENID: OPENID
    }).update({
      data: {
        money: _.inc(Number(money))
      }
    })
    ctx.body = {
      code: 1,
      msg: "充值成功",
      data: ''
    }
  })

  //检测库存
  app.router("isStockAdequate", async (ctx, next) => {
    let {
      productList
    } = event
    let product = db.collection('product')
    await Promise.all(productList.map(proItem => new Promise(async (resolve, reject) => {
        let {
          total
        } = await product.where({
          _id: proItem.productId,
          product_stock: _.gte(Number(proItem.product_count))
        }).count()
        if (total) {
          resolve(proItem)
        } else {
          reject(proItem)
        }
      })))
      .then(() => {
        ctx.body = {
          code: 1,
          msg: "商品充足",
          data: []
        }
      })
      .catch((adequateList) => {
        ctx.body = {
          code: 2,
          msg: "商品库存不足",
          data: adequateList
        }
      })
  })

  //用户购买
  app.router("orderPay", async (ctx, next) => {
    let {
      addressData,
      productList,
      allTotalAmount,
      remarks
    } = event
    let order = db.collection('order')
    let product = db.collection('product')
    let user = db.collection('user')

    //判断库存
    let adequateInfo = await Promise.all(productList.map(async (proItem) => {
      let {
        data
      } = await product.doc(proItem.productId).get()
      let reInfo = {
        product_name: data.product_name
      }
      if (data.product_stock >= proItem.product_count) {
        return Object.assign(reInfo, {
          flog: true
        })
      } else {
        return Object.assign(reInfo, {
          flog: false
        })
      }
    }))
    let adequateList = adequateInfo.filter(productItem => !productItem.flog) || []
    if (adequateList.length) {
      return ctx.body = {
        code: 2,
        msg: "商品库存不足",
        data: adequateList
      }
    }

    //判断余额
    let {
      total
    } = await user.where({
      OPENID: OPENID,
      money: _.gte(Number(allTotalAmount))
    }).count()
    if (!total) {
      return ctx.body = {
        code: 3,
        msg: "用户余额不足"
      }
    }

    await user.where({
      OPENID: OPENID
    }).update({
      data: {
        money: _.inc(-Number(allTotalAmount))
      }
    })

    await Promise.all(productList.map(async (proItem) => {
      await product.where({
        _id: proItem.productId
      }).update({
        data: {
          product_stock: _.inc(-Number(proItem.product_count)),
          product_sales: _.inc(Number(proItem.product_count))
        }
      })
    }))

    await order.add({
      data: {
        OPENID: OPENID,
        addressData: addressData,
        productList: productList,
        total: allTotalAmount,
        remarks: remarks,
        orderTime: new Date(),
        orderId: Number(Math.random().toString().substr(3, 2) + Date.now()).toString(10),
        state: 1
      }
    })

    ctx.body = {
      code: 1,
      msg: "购买成功",
      data: ''
    }
  })

  //添加反馈
  app.router('addFeedback', async (ctx, next) => {
    let {
      content
    } = event
    let feedback = db.collection('feedback')
    await feedback.add({
      data: {
        content,
        isRead: false,
        time: db.serverDate(),
        OPENID
      }
    })
    ctx.body = {
      code: 1,
      data: "添加成功"
    }
  })

  //获取用户收藏的商品
  app.router('getProductListByCollection', async (ctx, next) => {
    let {
      page,
      limit
    } = event
    let collection = db.collection('collection')

    let {
      list
    } = await collection.aggregate()
      .lookup({
        from: "product",
        localField: 'productId',
        foreignField: '_id',
        as: 'uapproval'
      }).match({
        OPENID: OPENID
      }).replaceRoot({
        newRoot: $.arrayElemAt(['$uapproval', 0])
      }).skip((page - 1) * limit)
      .limit(limit).end()

    ctx.body = {
      code: 1,
      data: list,
      msg: "获取成功"
    }
  })

  //根据订单状态获取订单
  app.router('getOrderListCompleted', async (ctx, next) => {
    let {
      state
    } = event
    let order = db.collection('order')

    let likeWhere = {
      OPENID
    }
    if (state !== -1) {
      likeWhere.state = state
    }

    let {
      data
    } = await order.where(likeWhere).get()

    ctx.body = {
      code: 1,
      data: FormatData(data, {
        orderTime: 'date'
      }),
      msg: "获取成功"
    }
  })

  //用户退货
  app.router('userReturnGoods', async (ctx, next) => {
    let {
      _id,
      OPENID
    } = event

    let order = db.collection('order')

    await order.where({
      _id,
      OPENID
    }).update({
      data: {
        state: STATE_THREE
      }
    })

    ctx.body = {
      code: 1,
      data: '',
      msg: "已提交退货请求"
    }
  })

  //添加用户预定
  app.router('userPreorder', async (ctx, next) => {
    let date = new Date()
    let hour = date.getHours() + 8
    let month = date.getMonth() + 1
    let m = month < 10 ? "0" + month : month
    let d = date.getFullYear() + "-" + m + "-" + date.getDate()

    let {
      position
    } = event
    let user = db.collection('user')
    let {
      data
    } = await user.where({
      OPENID
    }).get()

    if (data[0].isGrant == 'true') {
      let preorder = db.collection('preorder')
     let {_id} = await preorder.add({
        data: {
          time: d,
          OPENID,
          used: false,
          name: data[0].username,
          phone: data[0].phone,
          quxian:data[0].quxian,
          position
        }
      })

      ctx.body = {
        code: 1,
        message: "预定成功",
        data: {
          _id:_id,
          time: d,
          OPENID,
          used: false,
          name: data[0].username,
          phone: data[0].phone,
          position
        }
      }

    } else {
      ctx.body = {
        code: 0,
        data: "你还未注册"
      }
    }

  })

  //查询是否预定
  app.router('userPreorderQuery', async (ctx, next) => {
    let date = new Date()
    let month = date.getMonth() + 1
    let m = month < 10 ? "0" + month : month
    let d = date.getFullYear() + "-" + m + "-" + date.getDate()
    let preorder = db.collection('preorder')
    let {
      data
    } = await preorder.where({
      OPENID: OPENID,
      used: false,
      time: d
    }).get()
    if (data.length > 0) {
      ctx.body = {
        code: 1,
        mess: "已预定",
        data: data
      }
    } else {
      ctx.body = {
        code: 0,
        mess: "未预定"
      }
    }
  })

  //撤销预定
  app.router('userPreorderDelete', async (ctx, next) => {
    let date = new Date()
    let month = date.getMonth() + 1
    let m = month < 10 ? "0" + month : month
    let d = date.getFullYear() + "-" + m + "-" + date.getDate()
    let preorder = db.collection('preorder')

    ctx.body = {
      code: 1,
      data: await preorder.where({
        used: false,
        time: d,
        OPENID
      }).remove()
    }


  })

  //查询今日菜单
  app.router('userMenuQuery', async (ctx, next) => {
    let date = new Date()
    let month = date.getMonth() + 1
    let m = month < 10 ? "0" + month : month
    let d = date.getFullYear() + "-" + m + "-" + date.getDate()
    let menu = db.collection('menu')
    let {
      data
    } = await menu.where({
      date: d
    }).orderBy('category', 'desc').get()
    if (data) {
      ctx.body = {
        code: 1,
        data: data,
        date: d

      }
    }
  })

//添加关注
  app.router('addWatch', async (ctx, next) => {
    let {id,watched,username}=event
    let watch = db.collection('watch')
    if(!watched){   
    await db.collection('post').where({
      _id:id
    }).update({
      data:{
      watch:_.inc(1),
      watcherList:_.addToSet(username)
      
      }
    })  
  }else{
    
    await db.collection('post').where({
      _id:id
    }).update({
      data:{
      watch:_.inc(-1),
      watcherList:_.pull(username)
      }
    })
  }   
    ctx.body = {
      code: 1,
      data:watched,
      msg: "关注更新成功"
    }
  })  


  //查询关注

  app.router('getWatch', async (ctx, next) => {
    let {id,username}=event
    let {total} = await db.collection('post').where({
      _id:id,
      watcherList:  _.elemMatch(_.eq(username))
    }).count()    
   
    ctx.body = {
      code: total,
      data: total,
      msg: "查询成功"
    }
  })



  //用户就餐
  app.router('userPreorderuse', async (ctx, next) => {
    let date = new Date()
    let month = date.getMonth() + 1
    let m = month < 10 ? "0" + month : month
    let d = date.getFullYear() + "-" + m + "-" + date.getDate()

    let preorder = db.collection('preorder')

    await preorder.where({
      time: d,
      OPENID
    }).update({
      data: {
        used: true
      }
    })
   
   /*  await cloud.openapi.subscribeMessage.send({
      touser:'oaLYg4_WgX3EVTsGMLge5Y9ujxx0',
      templateId:'oxIA3YoT5kaUGK2L1UoGtHk8pQmXHK9fujJuFVXNrB0',
      data:{
        thing3:{
          value:'ygm'},
        time2:{
          value:d}
      }
    }) */

    ctx.body = {
      code: 1,
      data: '',
      msg: "就餐成功"
    }
  })

  return app.serve();
}