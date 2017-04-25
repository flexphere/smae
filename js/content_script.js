(function() {

  var RESULT = [];
  var RESULT_TMP = [];


  /**
   * ポップアップからのメッセージを取得
   */
  chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse){
    parse(location.href);
  });

  /**
   * 件名別の集計データを返す
   */
  function finalize(results){
    console.log(results);
    return results;
  }

  /**
   * 次のページがあるかどうか
   */
  function nextpage(dom){
    var next = $(".paginate [rel='next']", dom);
    return next.length ? next.eq(0).attr('href') : false;
  }

  /**
   * DOM解析し、件名別の集計データを返す
   */
  function parse(page_url){
    var page = page_url.match(/page=([0-9]+)/)
    page = (page) ? page[0] : "page=1"
    chrome.runtime.sendMessage({msg: '処理中：' + page}, function(response){
      var results = [];
      var ajax = $.ajax({
        type: 'get',
        dataType: 'html',
        url: page_url
      });

      ajax.done(function(html){
        mails = scrape(html);
        chrome.runtime.sendMessage({data:mails}, function(response){
          var next_url = nextpage(html);
          if (next_url) {
            parse(next_url);
          } else {
            chrome.runtime.sendMessage({msg: '完了', status:'done'});
          }
        });
      });
    });
  }

  /**
   * ページを解析
   */

   function scrape(dom){

    //メール送信要素確認
    if ( ! $(".mail_deliveries_list .item_body", dom).length) {
      chrome.runtime.sendMessage({msg: 'メールが見つかりませんでした'});
      return false;
    }

    var mails = [];
    $(".mail_deliveries_list .item_body", dom).each(function(item_index){
      var item = this;
      var subject = '';
      var tmp = [];
      var data = {};
      var selectors = {
        "send": ".item_elements li:eq(0) .element_content a",
        "resend": ".item_elements li:eq(0) .element_content_sub",
        "click": ".item_elements li:eq(1) .element_content",
        "download": ".item_elements li:eq(2) .element_content",
        "unread": ".item_elements li:eq(3) .element_content",
        "reject": ".item_elements li:eq(4) .element_content",
      }

      //件名を取得
      data["subject"] = $(".item_informations .item_name a", item).text();

      //各種値の取得
      $.each(selectors, function(key, selector){
        if (key == "unread") {
          data[key] = get_val($(selector, item).text().split("/")[0]);
        } else {
          data[key] = get_val($(selector, item));
        }
        $(selector, item).css("border", "solid 1px red")
      });

      mails.push(data)
    });
    return mails
  }

  // function scrape(dom){
  //   var headers = [];
  //   var subjects = {};
  //
  //   if ( ! $(".mail_deliveries_list .item_body", dom).length) return false;
  //
  //   $(".mail_deliveries_list .item_body", dom).each(function(i){
  //     //件名
  //     var subject = $(".item_informations .item_name a", this).text();
  //     // 一時オブジェクト
  //     var tmp = [];
  //
  //     $(".item_elements li", this).each(function(){
  //       //項目名の取得
  //       if (!i) {
  //         var title_main = get_str($(".element_name", this));
  //         var title_sub = get_str($(".element_name_sub", this));
  //         headers.push(title_main, title_sub);
  //       }
  //       //値の取得
  //       var value = $(".element_content a", this).length ?
  //                   get_val($(".element_content a", this)) :
  //                   get_val($(".element_content", this));
  //       var value_sub = get_val($(".element_content_sub", this));
  //       tmp.push(value, value_sub);
  //     });
  //
  //     //件名ごとに配列を作成
  //     if (typeof subjects[subject] === 'undefined') {
  //       subjects[subject] = {data:[],stats:[]};
  //     }
  //     subjects[subject].data.push(tmp);
  //   });
  //
  //   $.map(subjects, function(v, k) {
  //     v.stats = v.data.reduce(function(pre, cur){
  //       for(i=0;i<pre.length;i++){
  //         cur[i] += pre[i];
  //       }
  //       return cur;
  //     });
  //   });
  //
  //   return {
  //     header: headers,
  //     body: subjects
  //   };
  // }

  /**
   * テキストを取得し、改行・スペースを取り除いて返す
   */
  function get_str(jqObj){
    var text = get_child_text(jqObj);
    return text.replace(/[\s\n\r]/g, '');
  }

  /**
   * テキストを取得し、数値として返す
   */
  function get_val(param){
    var text = (typeof(param) == "object") ? get_child_text(param) : param;
    text = text.replace(/[^0-9.]/g, "");
    return parseFloat(text);
  }

  /**
   * 直下のテキストノードを取得
   */
  function get_child_text($target, str) {
  	var nodes = $target
  		.contents()
  		.filter(function(){
  			return this.nodeType === 3 // テキストノードか否か
  			&& /\S/.test(this.data) // 空白か否か
  			&& $.inArray($(this).parent(), $target) // 直下か否か
  			&& (typeof str === 'undefined' || str === this.nodeValue); // 文字列の指定がある場合
      });
    return nodes.text();
  }

}).call(this);
