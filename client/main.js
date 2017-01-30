import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Time, Money } from './random.js';
import { Meteor } from 'meteor/meteor';
import { Router } from 'meteor/iron:router';
import { Session } from 'meteor/session';
export const Answers = new Mongo.Collection('answers');
import './askme.html';

// router config
Router.configure({
	layoutTemplate: 'content',
	notFoundTemplate: 'notfound'
});

Router.route('/', function () {
	this.render('question', {
		to:"question"
	});
	this.render('nav', {
		to:"nav"
	});
});

Router.route('/posts/:type', function () {
	
	var params = this.params;
	var type = params.type;
	
	Session.set('type', type);
	Session.set('count_answers', 9);
	Session.set('filter', {'type' : Session.get('type')});
	Session.set('sort', {likes : -1});
	Session.set('filter_country', '');
	Session.set('filter_sex', '');
	Session.set('max_count_tags', 5);
	Session.set('total', 0);
	
	this.render('answers', {
		to:"question"
	});
	this.render('nav', {
		to:"nav"
	});
});

Router.route("/(.*)", function () {
	this.layout('notfound');
	this.render('notfound');
    this.next();
});

Template.nav.helpers({
	get_time(){
		var time = [];
		for(i in Time){
			time.push(
				{
					'value' : Time[i],
					'link'	: Time[i].replace(' ','')
				}
			);
		}
		return time;
	},
	get_money(){
		var money = [];
		for(i in Money){
			money.push(
				{
					'value' : Money[i].replace('$', ''),
					'link'	: Money[i]
				}
			);
		}
		return money;
	}
});

Template.nav.events({
	// show hide mobile menu
	'click #show_mob' : function(event, t){
		event.preventDefault();
		if($('#sidebar').hasClass('mob_left')){
			$('#sidebar').removeClass('mob_left');
			$('#main').removeClass('mob_right');
			$('#xs-menu li').addClass('hide');
		}else{
			$('#sidebar').addClass('mob_left');
			$('#main').addClass('mob_right');
			$('#xs-menu li').removeClass('hide');
		}
	},
	'click .money-title' :function(event, t){
		event.preventDefault();
		$('#time').animate({opacity : 0}, 200, function(){
			$(this).hide().css({opacity:1});
			$('#money').show();
			$('.money-title').addClass('activ');
			$('.time-title').removeClass('activ');
		});
	},
	'click .time-title' :function(event, t){
		event.preventDefault();
		$('#money').animate({opacity : 0}, 200, function(){
			$(this).hide().css({opacity:1});
			$('#time').show();
			$('.time-title').addClass('activ');
			$('.money-title').removeClass('activ');
		});
	},
	'click .home-title' :function(event, t){
		$('.home-title').addClass('activ');
		$('.money-title, .time-title').removeClass('activ');
	},
	'click .sidebar-icon-link' :function(event, t){
		if($('#sidebar-widgets').hasClass('sh')){
			$('#sidebar-widgets').hide().removeClass('sh');
		}else{
			$('#sidebar-widgets').show().addClass('sh');
		}
	}
});

Template.question.events({
	// save user answer
	'submit form.form-horizontal': function(event, t){
		event.preventDefault();
		var can_add 		= true;
		var answer 			= event.target.answer.value;
		var tags 			= event.target.tags.value;
		var sex 			= event.target.sex.value;
		var tags_list		= [];
		var result			= {};
		var country_code 	= null;

		// add simple validation
		if(answer == ''){
			$('[data-type="answer"]').addClass('has-error');
			can_add = false;
		}else{
			$('[data-type="answer"]').removeClass('has-error');
			result['answer'] = answer;
		}
		
		if(sex == ''){
			$('[data-type="sex"]').addClass('has-error');
			can_add = false;
		}else{
			$('[data-type="sex"]').removeClass('has-error');
			result['sex'] = sex;
		}
		
		if(tags != ''){
			tags_list = (tags.indexOf(' ') != -1)? 
				tags.split(/[ ,]+/):
				[tags];
			result['tags'] = tags_list;
		}
		
		result['can_add'] 	= can_add;
		result['type']		= Session.get('random');
			
		if (navigator.geolocation) {
			var timeoutVal = 10000;
			var id = navigator.geolocation.getCurrentPosition(
				displayPosition, 
				displayError,
				{ enableHighAccuracy: true, timeout: timeoutVal, maximumAge: 0 }
			);
			navigator.geolocation.clearWatch(id);
		}
		else{
			country_code = null;
		}

		function displayPosition(position){
			
			Meteor.call('getByGeoNames', {'lon' : position.coords.latitude, 'lat' : position.coords.longitude}, function(er, res){
				result['country'] = res;
				if(result['can_add']){
					success(result);
				}	
			});
		}

		function displayError(error) {
			var errors = { 
				1: 'Permission denied',
				2: 'Position unavailable',
				3: 'Request timeout'
			};
			country_code = null;
			result['country'] = country_code;
			if(result['can_add']){
				success(result);
			}	
		}
		
		// update random question, add answer and reset fields
		function success(r){
			// add answer
			Meteor.call('answers.Add', r);
			
			// reset fields
			event.target.answer.value 	= '';
			event.target.tags.value 	= '';
			$("input[name='sex']").removeAttr('checked');
			
			var items = Time.concat(Money);
			var RandomItems =  items[Math.floor(Math.random()*items.length)];
			Session.set('random', RandomItems);
		}
	}
});

Template.question.onCreated(function helloOnCreated() {
	var items = Time.concat(Money);
	var RandomItems =  items[Math.floor(Math.random()*items.length)];
	Session.set('random', RandomItems);
});

Template.question.helpers({
	random(){
		return Session.get('random');
	}
});

Template.answers.onCreated(function helloOnCreated() {
	Meteor.subscribe('answers');
	Session.set('count_answers', 8);
	Session.set('count_load', 4);
	
	Meteor.call('answers.getCountries', Session.get('type'), function(er, res){
		var dict = []
		for(i in res){
			dict.push({'country' : res[i]});
		}
		Session.set('country_list', dict);
	});
});

Template.answers.helpers({
	answers_list(){
		var filter = Session.get('filter');
		if(Session.get('filter_country') != ''){
			filter['country'] = Session.get('filter_country');
		}else{
			delete filter['country']; 
		}
		
		if(Session.get('filter_sex') != ''){
			filter['sex'] = Session.get('filter_sex');
		}else{
			delete filter['sex']; 
		}
		
		Session.set('filter', filter);
		
		res = Answers.find(Session.get('filter'), {sort: Session.get('sort'), limit: Session.get('count_answers')}).fetch();
		if(res.length > 0){
			var answers 		= [];
			var max_count_tags 	= Session.get('max_count_tags');
			if(res.length > 0){
				for(i in res){
					var list_tags = [];
					for(j in res[i]['tags']){
						if(max_count_tags <= j)
							break
						list_tags.push({'tag' : '#' + res[i]['tags'][j]});
					}

					var exec = /^\d+/.exec(res[i]['type']);
					if(exec != null){
						var ar = res[i]['type'].split(exec[0]);
						var text_type = exec[0] + ' ' + ar[1];
					}else{
						var text_type = res[i]['type'];
					}
					
					answers.push(
						{
							'answer' 	: res[i]['answer'],
							'type' 		: text_type,
							'tags'		: list_tags,
							'country'	: res[i]['country'],
							'likes'		: res[i]['likes'],
							'id'		: res[i]['_id']
						}
					);
				}
			}

			$('.load_more').removeClass('hide').removeClass('load').text('Load more');
			if(Session.get('total') <= Session.get('count_answers')){
				$('.load_more').addClass('hide');
			}
			return answers;
		}
	},
	getCountriesList(){
		return Session.get('country_list');
	},
	showButtons(){
		Meteor.call('answers.findAll', Session.get('type'), function(er, res){
			Session.set('total', res);
		});
		return Session.get('total');
	}
});

Template.answers.events({
	// add like
	'click .likes' : function(event, t){
		event.preventDefault();
		var id = $(event.currentTarget).data('id');
		Meteor.call('answers.addLike', id);
	},
	// load more answers
	'click .load_more' : function(event, t){
		event.preventDefault();
		$('.load_more').addClass('load').text('Wait please');
		var skip 	= Session.get('count_answers');
		var limit 	= Session.get('count_load');
		Session.set('count_answers', skip + limit);
	},
	// group by country
	'change #f_country' : function(event, t){
		event.preventDefault();
		var filter_country = $('#f_country option:selected').val();
		Session.set('filter_country', filter_country);
	},
	// group by sex
	'change #f_sex' : function(event, t){
		event.preventDefault();
		var filter_sex = $('#f_sex option:selected').val();
		Session.set('filter_sex', filter_sex);
	},
	// sort by most recent
	'click #f_recent' : function(event, t){
		event.preventDefault();
		Session.set('sort', {createdAt : -1});
	},
	// sort by most liked
	'click #f_liked' : function(event, t){
		event.preventDefault();
		Session.set('sort', {likes : -1});
	}
});