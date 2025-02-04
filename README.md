#  云开发 商城微信小程序

#### 前言

##### 因为项目功能太多，所以每次更新迭代不可能所以功能都测完，所以如果你发现bug可以联系我，主页有联系方式。我会尽快解决！！！！谢谢！！！

#### 项目介绍

```
小程序使用了云开发，商品分类、商品搜索、商品列表、搜素历史、用户订单管理、余额充值、管理员页面（用户管理、商品管理、分类管理、轮播图管理、用户反馈查看）
```

#### 更新内容

+ 2021-06-29更新：

  商城项目初建成
  
+ 2021-07-12更新：

  增加后台管理功能

#### 效果图

| ![](https://images.gitee.com/uploads/images/2021/0629/222928_f74ee81d_5004132.png) | ![](https://images.gitee.com/uploads/images/2021/0629/223005_d82c9afb_5004132.png) | ![](https://images.gitee.com/uploads/images/2021/0629/223134_b6dca7de_5004132.png ) |
| ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
|                                                              |                                                              |                                                              |
| ![](https://images.gitee.com/uploads/images/2021/0629/223129_d22106ea_5004132.png ) | ![](https://images.gitee.com/uploads/images/2021/0629/223252_3818d27a_5004132.png ) | ![](https://images.gitee.com/uploads/images/2021/0629/223257_4a1e6763_5004132.png ) |
| ![](https://images.gitee.com/uploads/images/2021/0629/223302_af68e5c9_5004132.png ) | ![](https://images.gitee.com/uploads/images/2021/0629/223506_81d5f05a_5004132.png ) | ![](https://images.gitee.com/uploads/images/2021/0629/223512_c1a30bbc_5004132.png ) |
| ![](https://images.gitee.com/uploads/images/2021/0712/200221_6e143c05_5004132.png ) | ![](https://images.gitee.com/uploads/images/2021/0712/200248_37a8f0c8_5004132.png) | ![](https://images.gitee.com/uploads/images/2021/0712/200325_893e65e9_5004132.png) |
| ![](https://images.gitee.com/uploads/images/2021/0712/200355_25cd56a0_5004132.png) | ![](https://images.gitee.com/uploads/images/2021/0712/200514_15f5fba1_5004132.png) | ![](https://images.gitee.com/uploads/images/2021/0712/200533_18b381ee_5004132.png) |

#### 项目技术

   开发技术：微信小程序原生开发

#### 安装教程

   ##### 1. 点赞项目，要不下面就要出bug（重点）

![](https://images.gitee.com/uploads/images/2021/0629/224422_fb5e256c_5004132.png )

##### 2. 下载代码到本地

![](https://images.gitee.com/uploads/images/2021/0629/224452_38fd6f45_5004132.png )

   ##### 3. 导入项目

![](https://images.gitee.com/uploads/images/2021/0222/202421_0777da7e_5004132.png "1613982586860.png")
       
      

  + APPID不能使用测试号

   ##### 4. 点击云开发按钮，申请开通

![](https://images.gitee.com/uploads/images/2021/0222/205413_ce2a428c_5004132.jpeg "5640239-390c0e44957c64c9.jpg")
![](https://images.gitee.com/uploads/images/2021/0222/205421_c5b736da_5004132.jpeg "5640239-5990e1052ff6dea4.jpg")

![](https://images.gitee.com/uploads/images/2021/0222/205234_b699e9fb_5004132.jpeg "5640239-6feeff5a61e497ef.jpg")


   + 填写信息，随便填

     

##### 5. 填写环境ID

![](https://images.gitee.com/uploads/images/2021/0629/225227_15cd6bd6_5004132.png )
![](https://images.gitee.com/uploads/images/2021/0629/225222_d68bef05_5004132.png )
![](https://images.gitee.com/uploads/images/2021/0629/225214_53ef6caa_5004132.png )



##### 6. 导入云开发数据库

![](https://images.gitee.com/uploads/images/2021/0629/224630_4d9bf32a_5004132.png )

   + 创建集合
   + **文件名称就是集合的名称，有几个JSON文件就创建几个集合**

![](https://images.gitee.com/uploads/images/2021/0222/203144_8c35c60b_5004132.png "1613983479181.png")

   + 导入文件到对应集合
   + 导入对应名称的json文件
   + 比如：**  `user.json` 就导入 到    `user` 集合中**

![](https://images.gitee.com/uploads/images/2021/0222/203232_8133eb8e_5004132.png "在这里输入图片标题")

![](https://images.gitee.com/uploads/images/2021/0222/203356_a3054f1e_5004132.png "1613983596307.png")

   + 看到数据，代表一个表导入成功，循环以上操作，导入所有的json文件

![](https://images.gitee.com/uploads/images/2021/0629/224707_7f6e20e2_5004132.png )



##### 7. 部署云开发的云函数

+ **每个目录就是一个云函数**


![](https://images.gitee.com/uploads/images/2021/0712/202138_c9516a80_5004132.png)


   + 右击

     ![](https://images.gitee.com/uploads/images/2021/0712/202619_0cdccc4f_5004132.gif)


![](https://images.gitee.com/uploads/images/2021/0222/210632_3e44a665_5004132.png "1613984053690.png")


![](https://images.gitee.com/uploads/images/2021/0222/210648_4da17234_5004132.png "1613984115069.png")

##### 8. 大功告成

![](https://images.gitee.com/uploads/images/2021/0629/225023_30fe4fb3_5004132.png )


   + 如有不懂，可联系我！如果这个项目对您有帮助，请作者喝杯咖啡吧。

     

| ![](https://images.gitee.com/uploads/images/2021/0429/110846_1139bfc0_5004132.jpeg) | ![](https://images.gitee.com/uploads/images/2021/0222/211338_770baf44_5004132.png "mm_facetoface_collect_qrcode_1613985143932.png") |
| :----------------------------------------------------------: | :----------------------------------------------------------: |



#### 结语

   本项目可以拿来学习、毕设。商业请谨慎。（本项目素材和部分页面借鉴了码云的其他前辈们，感谢！）

   如有不懂可联系我