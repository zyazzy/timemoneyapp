import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';
export const Answers = new Mongo.Collection('answers');

Meteor.publish('answers', function tasksPublication() {
	return Answers.find();
});

Meteor.methods({
	'answers.Add'(data){
		Answers.insert({
			type		: data['type'].replace(' ',''),
			answer 		: data['answer'],
			createdAt	: new Date(),
			tags		: data['tags'],
			sex			: data['sex'],
			country		: data['country'],
			likes		: 0
		});
	},
	'answers.addLike'(id){
		var ans = Answers.findOne({'_id' : id});
		var count = ans['likes'] + 1;
		Answers.update(id, { $set: { likes: count } });
	},
	'answers.getCountries'(type){
		var data = Answers.find({type : type}).fetch();
		var countries = [];
		for(i in data){
			if(countries.indexOf(data[i]['country']) == -1)
				countries.push(data[i]['country']);
		}
		return countries;
	},
	'answers.findAll'(type){
		var total = Answers.find({type : type}).count();
		return total;
	},
	'getByGeoNames'(data){
		var result = HTTP.get('http://api.geonames.org/countryCode?username=bengalua&lat='+data['lon']+'&lng='+data['lat']);
		return result.content.replace(/\r?\n|\r/,"");
	}
});