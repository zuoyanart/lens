module.exports = {
  source: {
    path: './source/test.sketch',
    artboardName:'',
    baseWidth:375 //设计稿基准宽度px
  },
  h5:{
    page:{
      extName:'.html'
    },
    style:{
      extName:'.css',
      pageDisplayPath: './',
      unit:{
        scale: 0.02, //缩放比例
        precision: 6, //小数精度
        name: 'rem'
      }
    },
    image:{
      pageDisplayPath: './images'
    }
  },
  uniapp:{
    style:{
      unit:{
        scale: 2, //缩放比例
        precision: 6, //小数精度
        name: 'rpx'
      }
    },
    image:{
      pageDisplayPath: './images'
    },
    page:{
      extName:'.vue'
    }
  }
};
