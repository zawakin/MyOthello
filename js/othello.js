$(function() {
  const cnvs = $("#cnvs");
  if(ww < 600){
	$("#cnvs").attr("width", ww);
	$("#cnvs").attr("height", ww);
  }
  cnvs.css("background-color", "darkgreen");

  const TURN = {
    NONE : 0,
    BLACK : 1,
    WHITE : 2
  }
  class OthelloGame {
    constructor(Nsize, width){
      this.Nsize = Nsize;
      this.width = width;
      this.cellsize = width / (Nsize+1);
      this.tesuu = 0;
      this.turn = TURN.BLACK;
      this.passed = false;
      this.board = [];
      for(var i=0; i<this.Nsize; i++){
        this.board[i] = [];
        for(var j=0; j<this.Nsize; j++){
          this.board[i][j] = TURN.NONE;
        }
      }
      this.board[this.Nsize/2-1][this.Nsize/2-1] = TURN.WHITE;
      this.board[this.Nsize/2][this.Nsize/2] = TURN.WHITE;
      this.board[this.Nsize/2-1][this.Nsize/2] = TURN.BLACK;
      this.board[this.Nsize/2][this.Nsize/2-1] = TURN.BLACK;
      this.okeru = [];
      this.hist = [];
      this.hist.push(this.copy_board_from(this.board));

      this.okeru = [];
      for(var yi=0;yi<this.Nsize;yi++){
        for(var xi=0;xi<this.Nsize;xi++){
          if(this.check_okeru(xi, yi)){
            this.okeru.push([xi,yi]);
          }
        }
      }
      var counts = this.count_colors();
      var okerus = this.msg_okeru();
      $("#counts").text("石の数　黒 : " + counts.BLACK + " 白 : " + counts.WHITE);
      $("#okeru").text("置ける場所　黒 : " + okerus.BLACK + " 白 : " + okerus.WHITE);
    }

    print_board(){
      var s = "";
      for(var i=0; i<this.Nsize; i++){
        for(var j=0; j<this.Nsize; j++){
          var c = "";
          switch (this.board[i][j]) {
            case TURN.WHITE:
              c = "W";
              break;
            case TURN.BLACK:
              c = "B";
              break;
            case TURN.NONE:
              c = "0";
              break;
          }
          s += c;
        }
        s += "\n";
      }
      console.log(s);
    }

    draw(ctx){
      //clear board
        ctx.clearRect(0,0,this.width,this.width);

      //draw empty board
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        for(var i=0; i<=this.Nsize; i++){
          ctx.moveTo(this.cellsize*(i + 1/2), this.cellsize/2);
          ctx.lineTo(this.cellsize*(i + 1/2), this.cellsize*(this.Nsize+1/2));
          ctx.moveTo(this.cellsize/2, this.cellsize*(i + 1/2));
          ctx.lineTo(this.cellsize*(this.Nsize+1/2), this.cellsize*(i + 1/2));
        }
        ctx.closePath();
        ctx.stroke();

      // draw discs
      for(var xi=0; xi<this.Nsize; xi++){
        for(var yi=0; yi<this.Nsize; yi++){
          if(this.board[yi][xi] != TURN.NONE){
            ctx.beginPath();
            ctx.arc(
              this.cellsize + xi * this.cellsize,
              this.cellsize + yi * this.cellsize,
              this.cellsize * 0.4,
              0,
              Math.PI * 2,
              true
            );
            if(this.board[yi][xi] == TURN.BLACK){
              ctx.fillStyle = "black";
            }else{
              ctx.fillStyle = "white";
            }
            ctx.fill();
          }
        }
      }

      for(let arr of this.okeru){
        var xi = arr[0]; var yi = arr[1];
        ctx.beginPath();
        ctx.arc(
          this.cellsize + xi * this.cellsize,
          this.cellsize + yi * this.cellsize,
          this.cellsize * 0.1,
          0,
          Math.PI * 2,
          true
        );
        ctx.fillStyle = "gray";
        ctx.fill();
      }
    }
    check_okeru(xi, yi){
      return this.check_okeru_from(this.board, this.turn, xi, yi);
    }
    check_okeru_from(board, turn, xi, yi){
      var flag = false;
      if(board[yi][xi] != TURN.NONE) return false;
      var ds = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
      // var ds = [[1, 0], [-1, 0]];
      for(let d of ds){
        var _xi = xi; var _yi = yi;
        var dx = d[0]; var dy = d[1];
        _xi += dx; _yi += dy;
        var flag_temp = false;
        while(this.in_board(_xi, _yi)){
          if(board[_yi][_xi] == 3 - turn){
            _xi += dx; _yi += dy;
            flag_temp = true;
          }else{
            break;
          }
        }
        if(!this.in_board(_xi, _yi)) continue;
        if(flag_temp && board[_yi][_xi] == turn){
          return true;
        }
      }
      return false;
    }
    in_board(xi, yi){
      return 0<= xi & xi < this.Nsize & 0<=yi & yi < this.Nsize;
    }
    put_disc(xi, yi){
        var ds = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
        for(let d of ds){
          var _xi = xi; var _yi = yi;
          var dx = d[0]; var dy = d[1];
          _xi += dx; _yi += dy;
          var flag_temp = false;
          while(this.in_board(_xi,_yi)){
            if(this.board[_yi][_xi] == 3 - this.turn){
              _xi += dx; _yi += dy;
              flag_temp = true;
            }else{
              break;
            }
          }
          if(!this.in_board(_xi, _yi)) continue;
          if(flag_temp & this.board[_yi][_xi] == this.turn){
            while((_xi != xi) || (_yi != yi)){
              this.board[_yi][_xi] = this.turn;
              _xi -= dx; _yi -= dy;
            }
            this.board[_yi][_xi] = this.turn;

          }
        }
    }
    matta(){
      if(this.tesuu < 1) return;
      this.turn = 3 - this.turn;
      this.board = this.copy_board_from(this.hist[this.tesuu-1]);
      this.tesuu -= 1;
      this.update_okeru();
      if(this.turn == TURN.BLACK){
        $("#msg").text("黒の手番です");
      }else{
        $("#msg").text("白の手番です");
      }
      var counts = this.count_colors();
      var okerus = this.msg_okeru();
      $("#counts").text("石の数　黒 : " + counts.BLACK + " 白 : " + counts.WHITE);
      $("#okeru").text("置ける場所　黒 : " + okerus.BLACK + " 白 : " + okerus.WHITE)
    }
    get_Mae(){
      return this.hist[this.tesuu-1];
    }
    save_hist(){
      var temp = [];
      for(var yi=0; yi<this.Nsize; yi++){
        temp[yi] = [];
        for(var xi=0; xi<this.Nsize; xi++){
          temp[yi][xi] = this.board[yi][xi];
        }
      }
      this.hist.push(temp);
      // console.log(this.hist);
    }
    copy_board_from(board){
      var temp = [];
      for(var yi=0; yi<this.Nsize; yi++){
        temp[yi] = [];
        for(var xi=0;xi<this.Nsize; xi++){
          temp[yi][xi] = board[yi][xi];
        }
      }
      return temp;
    }

    count_okeru_from(board, turn){
        var okeru = [];
        for(var yi=0;yi<this.Nsize;yi++){
          for(var xi=0;xi<this.Nsize;xi++){
            if(this.check_okeru_from(board, turn, xi, yi)){
              okeru.push([xi,yi]);
            }
          }
        }
        return okeru.length;
    }
    msg_okeru(){
      var black = this.count_okeru_from(this.board, TURN.BLACK);
      var white = this.count_okeru_from(this.board, TURN.WHITE);
      return {"BLACK": black, "WHITE": white};
    }

    count_colors(){
      var black = 0;
      var white = 0;
      for(var yi=0;yi<this.Nsize;yi++){
        for(var xi=0;xi<this.Nsize;xi++){
          if(this.board[yi][xi] == TURN.BLACK){
            black++;
          }else{
            if(this.board[yi][xi] == TURN.WHITE){
              white++;
            }
          }
        }
      }
      return {"BLACK": black, "WHITE": white};
    }
    count_empty(){

      var empty = 0;
      for(var yi=0;yi<this.Nsize;yi++){
        for(var xi=0;xi<this.Nsize;xi++){
          if(this.board[yi][xi] == TURN.NONE){
            empty ++;
          }
        }
      }
      return empty;
    }
    update_okeru(){
      this.okeru = [];
      for(var yi=0;yi<this.Nsize;yi++){
        for(var xi=0;xi<this.Nsize;xi++){
          if(this.check_okeru(xi, yi)){
            this.okeru.push([xi,yi]);
          }
        }
      }
    }
    update_to_next(){
        this.turn = 3 - this.turn;
        this.save_hist();
        this.tesuu += 1;
        if(this.turn == TURN.BLACK){
          $("#msg").text("黒の手番です");
        }else{
          $("#msg").text("白の手番です");
        }
        var counts = this.count_colors();
        var okerus = this.msg_okeru();
        $("#counts").text("石の数　黒 : " + counts.BLACK + " 白 : " + counts.WHITE);
        $("#okeru").text("置ける場所　黒 : " + okerus.BLACK + " 白 : " + okerus.WHITE)
		$("#wariai_black").width(100 * (counts.BLACK/(counts.BLACK+counts.WHITE))+"%");
        this.update_okeru();

        if(this.count_empty() == 0){
          this.finish(counts);
          return;
        }
        if(this.okeru.length == 0){
          console.log(this.passed);
          if(!this.passed){
            //pass
            $("#pass").text("パス");
            this.passed = true;
            // this.update_to_next();
            this.turn = 3 - this.turn;
            this.save_hist();
            this.tesuu += 1;
            this.update_okeru();
            if(this.turn == TURN.BLACK){
              $("#msg").text("黒の手番です");
            }else{
              $("#msg").text("白の手番です");
            }
          }else{
            this.finish(counts);
            return;
          }
        }else{
          $("#pass").text("");
          this.passed = false;
        }
    }
    update_with_hand(xi, yi){
        this.put_disc(xi, yi);
        this.update_to_next();
    }
    finish(counts){
      var black = counts.BLACK;
      var white = counts.WHITE;
      var ss;
      if(black > white){
        ss = "黒の勝利！";
      }else{
        if(black < white){
        ss = "白の勝利！";
        }else{
        ss = "引き分け";
        }
      }
      $("#msg").text("ゲーム終了：" + ss);
    }
}
class OthelloGameCPU extends OthelloGame{
    update_with_hand(xi, yi){
        this.put_disc(xi, yi);
        this.update_to_next();
		var te = this.think();
		this.put_disc(te[0], te[1]);
		this.update_to_next();
    }
	update_silent(){
        this.turn = 3 - this.turn;
        this.save_hist();
        this.tesuu += 1
		
        var counts = this.count_colors();
        this.update_okeru();

	}
	count_okeru_from_te(xi, yi){
		var bf = new BoardFuture(this.board, this.turn);
		bf.update_te(xi, yi);
		console.log(bf.count_okeru());
		return bf.count_okeru();
	}
	think(){
		// return this.think_random();
		return this.think_minimize_okeru();
	}
	think_random(){
		// 置ける中からランダム
		return this.okeru[Math.floor(Math.random() * this.okeru.length)];
	}    
	think_minimize_okeru(){
		// 敵の置ける場所の数を最小にするような手を選ぶ
		var min_okeru = 10000;
		var min_i = -1;
		console.log("start");
		for(let i=0; i<this.okeru.length; i++){
			var te = this.okeru[i];
			var co = this.count_okeru_from_te(te[0], te[1]);
			console.log(co);
			if (co < min_okeru){
				min_okeru = co;
				min_i = i;
			}
		}
		console.log(min_i, min_okeru);
		return this.okeru[min_i];
	}
	matta(){
      if(this.tesuu < 1) return;
      this.turn = this.turn;
      this.board = this.copy_board_from(this.hist[this.tesuu-2]);
      this.tesuu -= 2;
      this.update_okeru();
      if(this.turn == TURN.BLACK){
        $("#msg").text("黒の手番です");
      }else{
        $("#msg").text("白の手番です");
      }
      var counts = this.count_colors();
      var okerus = this.msg_okeru();
      $("#counts").text("石の数　黒 : " + counts.BLACK + " 白 : " + counts.WHITE);
      $("#okeru").text("置ける場所　黒 : " + okerus.BLACK + " 白 : " + okerus.WHITE)
    }
}
class BoardFuture{
	constructor(board, turn){
		this.future = [];
		this.Nsize = 8;
		this.future.push(this.copy_board_from(board));
		this.board = this.copy_board_from(board);
		this.turn = turn;
		this.okeru = [];
	}
    copy_board_from(board){
      var temp = [];
      for(var yi=0; yi<this.Nsize; yi++){
        temp[yi] = [];
        for(var xi=0;xi<this.Nsize; xi++){
          temp[yi][xi] = board[yi][xi];
        }
      }
      return temp;
    }
	update_te(xi, yi){
		this.put_disc(xi, yi);
		this.turn = 3 - this.turn;
		this.future.push(this.copy_board_from(this.board));
	}
	back(){
		this.future.pop();
		this.board = this.future[this.future.length-1];
		this.turn = 3 - this.turn;
	}
    put_disc(xi, yi){
        var ds = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
        for(let d of ds){
          var _xi = xi; var _yi = yi;
          var dx = d[0]; var dy = d[1];
          _xi += dx; _yi += dy;
          var flag_temp = false;
          while(this.in_board(_xi,_yi)){
            if(this.board[_yi][_xi] == 3 - this.turn){
              _xi += dx; _yi += dy;
              flag_temp = true;
            }else{
              break;
            }
          }
          if(!this.in_board(_xi, _yi)) continue;
          if(flag_temp & this.board[_yi][_xi] == this.turn){
            while((_xi != xi) || (_yi != yi)){
              this.board[_yi][_xi] = this.turn;
              _xi -= dx; _yi -= dy;
            }
            this.board[_yi][_xi] = this.turn;

          }
        }
    }
    check_okeru(xi, yi){
      return this.check_okeru_from(this.board, this.turn, xi, yi);
    }
    check_okeru_from(board, turn, xi, yi){
      var flag = false;
      if(board[yi][xi] != TURN.NONE) return false;
      var ds = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
      // var ds = [[1, 0], [-1, 0]];
      for(let d of ds){
        var _xi = xi; var _yi = yi;
        var dx = d[0]; var dy = d[1];
        _xi += dx; _yi += dy;
        var flag_temp = false;
        while(this.in_board(_xi, _yi)){
          if(board[_yi][_xi] == 3 - turn){
            _xi += dx; _yi += dy;
            flag_temp = true;
          }else{
            break;
          }
        }
        if(!this.in_board(_xi, _yi)) continue;
        if(flag_temp && board[_yi][_xi] == turn){
          return true;
        }
      }
      return false;
    }
    in_board(xi, yi){
      return 0<= xi & xi < this.Nsize & 0<=yi & yi < this.Nsize;
    }
    count_okeru(){
		var board = this.board;
		var turn = this.turn;
        var okeru = [];
        for(var yi=0;yi<this.Nsize;yi++){
          for(var xi=0;xi<this.Nsize;xi++){
            if(this.check_okeru_from(board, turn, xi, yi)){
              okeru.push([xi,yi]);
            }
          }
        }
        return okeru.length;
    }
    update_okeru(){
      this.okeru = [];
      for(var yi=0;yi<this.Nsize;yi++){
        for(var xi=0;xi<this.Nsize;xi++){
          if(this.check_okeru(xi, yi)){
            this.okeru.push([xi,yi]);
          }
        }
      }
    }
	
}

  var p_main = cnvs.position();
  var game = new OthelloGame(8, cnvs.width());
  const ctx = cnvs[0].getContext("2d");
  // game.draw(ctx);
  var mouse = {x: 0, y: 0};
  var Imouse = {xi: -1, yi: -1};
  var clicked = false;
  var busy = false;
  var gameChu = false;
  $("#passbtn").click(()=>{
    console.log("click");
    game.update_to_next();
  });
  $("#matta").click(()=>{
    game.matta();
  });
  cnvs.mousemove((e)=>{
    mouse.x = e.pageX - p_main.left;
    mouse.y = e.pageY - p_main.top;
  });
  cnvs.click(()=>{
    clicked = true;
    // alert();
  });
  $("#vsHuman").click(()=>{
	gameChu = true;  
	$(".startbtn").hide();
	$("#cnvs").removeClass("w3-opacity");
	$("#infobox").show();
  });
  $("#vsCPU").click(()=>{
	gameChu = true;  
	$(".startbtn").hide();
	$("#cnvs").removeClass("w3-opacity");
	$("#infobox").show();
	game = new OthelloGameCPU(8, cnvs.width());
  });
  function render(){
    var xi = parseInt((mouse.x - game.cellsize/2) / game.cellsize);
    var yi = parseInt((mouse.y - game.cellsize/2) / game.cellsize);
    Imouse.xi = xi;
    Imouse.yi = yi;
    // console.log(Imouse);
    if(clicked){
      if(gameChu && !busy && 0<= xi & xi < game.Nsize & 0<=yi & yi < game.Nsize){
        busy = true;
        //Put a disc
        // console.log("***", xi, yi, game.turn, game.check_okeru(xi, yi));
        if(game.check_okeru(xi, yi)){
          game.update_with_hand(xi, yi);
        }
        busy = false;
      }
      clicked = false;
    }    // game.print_board();
    game.draw(ctx);
    // clicked = false;
  }
  setInterval(render, 100);

});
