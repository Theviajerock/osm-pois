// https://github.com/Leaflet/Leaflet
var map = new L.Map('map');
map.setView([-27.4927, -58.8063], 12);

// https://github.com/mlevans/leaflet-hash
var hash = new L.Hash(map);

// https://github.com/leaflet-extras/leaflet-providers
L.tileLayer.provider(
    'OpenStreetMap.Mapnik',
    {
	attribution: 'Data: <a href="http://www.overpass-api.de/">OverpassAPI</a>/ODbL OpenStreetMap'
    }
).addTo(map);

// https://github.com/domoritz/leaflet-locatecontrol
L.control.locate().addTo(map);

var icons = {
    bank: {
	name: 'Banco',
	query: 'amenity=^bank$',
	iconName: 'bank',
	markerColor: 'cadetblue'
    },
    atm: {
	name: 'Cajero Automático',
	query: 'amenity=^atm$',
	iconName: 'bank',
	markerColor: 'cadetblue'
    },

    clinic: {
	name: 'Clínica',
	query: 'amenity=^clinic$',
	iconName: 'hospital-o',
	markerColor: 'red'
    },
    pharmacy: {
	name: 'Farmacia',
	query: 'amenity=^pharmacy$',
	iconName: 'plus-square',
	markerColor: 'green'
    },

    fuel: {
	name: 'Estación de Servicio',
	query: 'amenity=^fuel$',
	iconName: 'car',
	markerColor: 'orange'
    },

    supermarket: {
	name: 'Supermercado',
	query: 'shop=^supermarket$',
	iconName: 'calculator',
	markerColor: 'blue'
    },

    viewpoint: {
	name: 'Mirador',
	query: 'tourism=^viewpoint$',
	iconName: 'star',
	markerColor: 'orange'
    },

    'camp_site': {
	name: 'Camping',
	query: 'tourism=^camp_site$',
	iconName: 'fire',
	markerColor: 'green'
    },
    hotel: {
	name: 'Hotel',
	query: 'tourism=^hotel$',
	iconName: 'building',
	markerColor: 'darkred'
    },
    hostel: {
	name: 'Hostel',
	query: 'tourism=^hostel$',
	iconName: 'building',
	markerColor: 'darkred'
    }

}

var iconLayer = new L.LayerGroup();
map.addLayer(iconLayer);

// https://github.com/kartenkarsten/leaflet-layer-overpass
function callback(data) {
    for(i=0; i < data.elements.length; i++) {
	e = data.elements[i];

	if (e.id in this.instance._ids) return;
	this.instance._ids[e.id] = true;

	var pos = new L.LatLng(e.lat, e.lon);

	// TODO: improve this
	var type;
	if (e.tags.amenity) type = e.tags.amenity;
	if (e.tags.tourism) type = e.tags.tourism;
	if (e.tags.shop) type = e.tags.shop;
	var icon = icons[type];

	var markerIcon  = L.AwesomeMarkers.icon({
	    icon: icon.iconName,
	    markerColor: icon.markerColor,
	    prefix: 'fa'
	});
	var marker = L.marker(pos, {icon: markerIcon})
	var markerPopup = '<h3>Etiquetas</h3>';
	for(tag in e.tags) {
	    markerPopup += Mustache.render(
		'<strong>{{name}}:</strong> {{value}}<br>',
		{name: tag, value: e.tags[tag]});
	}

	marker.bindPopup(markerPopup)
	marker.addTo(this.instance);
    }
}

function build_overpass_query() {
    keys = [];
    values = [];
    $('#settings input:checked').each(function(i, element) {
	keys.push(element.dataset.key);
	values.push(element.dataset.value);
    });

    keys = keys.join('|');
    values = values.join('|')

    // TODO: when a building matches a POI it's not shown in the map
    // because we need to filter by "way" instead of "node". In case,
    // we filter by "way" we need to get the lat/lon of the centre
    query = Mustache.render(
	"node(BBOX)[~'{{keys}}'~'{{values}}'];out;",
	{keys: keys, values: values}
    );
}

function setting_changed() {
    // remove icons from current map
    iconLayer.clearLayers();
    build_overpass_query();
    if(keys == '' || values == '') return
    show_overpass_layer();
}

function show_settings() {
    for(icon in icons) {
	query = icons[icon].query.split('=');
	var checkbox = Mustache.render(
	    '<input type="checkbox" data-key="{{key}}" data-value="{{value}}" onclick="setting_changed()"> {{name}}<br>',
	    {icon: icon, key: query[0], value: query[1], name: icons[icon].name}
	);
	$('#settings').append(checkbox);
    }
}
show_settings();

var query = [];
build_overpass_query();

function show_overpass_layer() {
    var opl = new L.OverPassLayer({
	query: query,
	callback: callback,
	minzoom: 14,
    });

    iconLayer.addLayer(opl);
}
show_overpass_layer();
