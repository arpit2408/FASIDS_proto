var expect = require('chai').expect;
var _ = require("underscore");
var mongoose = require("mongoose");
var utility = require('../utility.js');
mongoose.connect(utility.dburl);
var FireAntProduct =  require("../../db_models/index.js").FireAntProduct;

describe("FireAntProduct", function (){
  describe(".getAmount()", function (){
    it("should return proper units of product", function (done){
      FireAntProduct.findOne({product_id:100056182}).exec(function (err, product){
        if (err) throw err;
        var totalarea = 5000;
        var density = 0.02;
        expect(product.getAmount(totalarea, density)).to.equal((totalarea * density / product.coverage).toFixed(1));
        done();
      });
    });
  });

});