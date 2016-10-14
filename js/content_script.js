(function() {
  /**
   * ポップアップからのメッセージを取得
   */
  chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse){
    var res = scrape();

    if (res) {
      sendResponse({
        success: true,
        data: res
      });
    } else {
      sendResponse({
        success: false,
        message: 'データ取得に失敗しました'
      });
    }

  });

  /**
   * DOMを解析し、件名別の集計データを返す
   */
  function scrape(){
    var headers = [];
    var subjects = {};

    if ( ! $(".mail_deliveries_list .item_body").length) return false;

    $(".mail_deliveries_list .item_body").each(function(i){
      //件名
      var subject = $(".item_informations .item_name a", this).text();
      // 一時オブジェクト
      var tmp = [];

      $(".item_elements li", this).each(function(){
        //項目名の取得
        if (!i) {
          var title_main = get_str($(".element_name", this));
          var title_sub = get_str($(".element_name_sub", this));
          headers.push(title_main, title_sub);
        }
        //値の取得
        var value = $(".element_content a", this).length ?
                    get_val($(".element_content a", this)) :
                    get_val($(".element_content", this));
        var value_sub = get_val($(".element_content_sub", this));
        tmp.push(value, value_sub);
      });

      //件名ごとに配列を作成
      if (typeof subjects[subject] === 'undefined') {
        subjects[subject] = {data:[],stats:[]};
      }
      subjects[subject].data.push(tmp);
    });

    $.map(subjects, function(v, k) {
      v.stats = v.data.reduce(function(pre, cur){
        for(i=0;i<pre.length;i++){
          cur[i] += pre[i];
        }
        return cur;
      });
    });

    return {
      header: headers,
      body: subjects
    };
  }

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
  function get_val(jqObj){
    var text = get_child_text(jqObj);
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
