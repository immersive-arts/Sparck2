{
	"patcher" : 	{
		"fileversion" : 1,
		"appversion" : 		{
			"major" : 8,
			"minor" : 5,
			"revision" : 1,
			"architecture" : "x64",
			"modernui" : 1
		}
,
		"classnamespace" : "box",
		"rect" : [ 5.0, 66.0, 540.0, 650.0 ],
		"bglocked" : 0,
		"openinpresentation" : 1,
		"default_fontsize" : 12.0,
		"default_fontface" : 0,
		"default_fontname" : "Arial",
		"gridonopen" : 1,
		"gridsize" : [ 15.0, 15.0 ],
		"gridsnaponopen" : 1,
		"objectsnaponopen" : 1,
		"statusbarvisible" : 2,
		"toolbarvisible" : 0,
		"lefttoolbarpinned" : 0,
		"toptoolbarpinned" : 0,
		"righttoolbarpinned" : 0,
		"bottomtoolbarpinned" : 0,
		"toolbars_unpinned_last_save" : 0,
		"tallnewobj" : 0,
		"boxanimatetime" : 200,
		"enablehscroll" : 0,
		"enablevscroll" : 1,
		"devicewidth" : 0.0,
		"description" : "",
		"digest" : "",
		"tags" : "",
		"style" : "default",
		"subpatcher_template" : "",
		"assistshowspatchername" : 0,
		"title" : "TfmNodePath - Help",
		"boxes" : [ 			{
				"box" : 				{
					"args" : [ "TfmNodePath" ],
					"bgmode" : 0,
					"border" : 0,
					"clickthrough" : 0,
					"enablehscroll" : 0,
					"enablevscroll" : 0,
					"id" : "obj-4",
					"lockeddragscroll" : 0,
					"lockedsize" : 0,
					"maxclass" : "bpatcher",
					"name" : "bs.help.util.node.links.maxpat",
					"numinlets" : 0,
					"numoutlets" : 0,
					"offset" : [ 0.0, 0.0 ],
					"patching_rect" : [ 32.5, 332.0, 296.0, 63.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 5.0, 176.0, 517.0, 65.0 ],
					"viewvisibility" : 1
				}

			}
, 			{
				"box" : 				{
					"args" : [ "TfmNodePath", "Feedback" ],
					"bgmode" : 0,
					"border" : 0,
					"clickthrough" : 0,
					"enablehscroll" : 0,
					"enablevscroll" : 0,
					"id" : "obj-3",
					"lockeddragscroll" : 0,
					"lockedsize" : 0,
					"maxclass" : "bpatcher",
					"name" : "bs.help.util.node.textblock.maxpat",
					"numinlets" : 0,
					"numoutlets" : 0,
					"offset" : [ 0.0, 0.0 ],
					"patching_rect" : [ 32.5, 574.0, 296.0, 44.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 5.0, 952.0, 517.0, 114.0 ],
					"viewvisibility" : 1
				}

			}
, 			{
				"box" : 				{
					"args" : [ "TfmNodePath", "Notes" ],
					"bgmode" : 0,
					"border" : 0,
					"clickthrough" : 0,
					"enablehscroll" : 0,
					"enablevscroll" : 0,
					"id" : "obj-2",
					"lockeddragscroll" : 0,
					"lockedsize" : 0,
					"maxclass" : "bpatcher",
					"name" : "bs.help.util.node.textblock.maxpat",
					"numinlets" : 0,
					"numoutlets" : 0,
					"offset" : [ 0.0, 0.0 ],
					"patching_rect" : [ 32.5, 519.0, 296.0, 44.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 5.0, 820.0, 517.0, 126.0 ],
					"viewvisibility" : 1
				}

			}
, 			{
				"box" : 				{
					"args" : [ "TfmNodePath", "p", "PropertyReference" ],
					"bgmode" : 0,
					"border" : 0,
					"clickthrough" : 0,
					"enablehscroll" : 0,
					"enablevscroll" : 0,
					"id" : "obj-6",
					"lockeddragscroll" : 0,
					"lockedsize" : 0,
					"maxclass" : "bpatcher",
					"name" : "bs.help.util.ossia.reference.maxpat",
					"numinlets" : 0,
					"numoutlets" : 0,
					"offset" : [ 0.0, 0.0 ],
					"patching_rect" : [ 32.5, 460.0, 296.0, 44.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 5.0, 245.0, 517.0, 573.0 ],
					"viewvisibility" : 1
				}

			}
, 			{
				"box" : 				{
					"args" : [ "TfmNodePath" ],
					"bgmode" : 0,
					"border" : 0,
					"clickthrough" : 0,
					"enablehscroll" : 0,
					"enablevscroll" : 0,
					"id" : "obj-36",
					"lockeddragscroll" : 0,
					"lockedsize" : 0,
					"maxclass" : "bpatcher",
					"name" : "bs.help.util.node.head.maxpat",
					"numinlets" : 2,
					"numoutlets" : 2,
					"offset" : [ 0.0, 0.0 ],
					"outlettype" : [ "", "" ],
					"patching_rect" : [ 32.5, 24.0, 296.0, 247.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 5.0, 3.0, 517.0, 164.0 ],
					"viewvisibility" : 1
				}

			}
, 			{
				"box" : 				{
					"fontsize" : 8.0,
					"hidden" : 1,
					"id" : "obj-24",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "" ],
					"patching_rect" : [ 32.5, 303.0, 72.0, 17.0 ],
					"save" : [ "#N", "thispatcher", ";", "#Q", "end", ";" ],
					"text" : "thispatcher"
				}

			}
, 			{
				"box" : 				{
					"comment" : "",
					"hidden" : 1,
					"id" : "obj-34",
					"index" : 0,
					"maxclass" : "outlet",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 309.5, 303.0, 17.0, 17.0 ]
				}

			}
, 			{
				"box" : 				{
					"comment" : "",
					"hidden" : 1,
					"id" : "obj-32",
					"index" : 0,
					"maxclass" : "outlet",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 7.0, 303.0, 17.0, 17.0 ]
				}

			}
, 			{
				"box" : 				{
					"comment" : "",
					"hidden" : 1,
					"id" : "obj-30",
					"index" : 0,
					"maxclass" : "inlet",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 309.5, 1.0, 17.0, 17.0 ]
				}

			}
, 			{
				"box" : 				{
					"comment" : "",
					"hidden" : 1,
					"id" : "obj-28",
					"index" : 0,
					"maxclass" : "inlet",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 32.5, 1.0, 17.0, 17.0 ]
				}

			}
, 			{
				"box" : 				{
					"fontface" : 1,
					"fontname" : "Verdana",
					"id" : "obj-26",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 2.0, 1120.0, 522.0, 21.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 1.0, 1095.0, 522.0, 21.0 ],
					"text" : "*__________________________________________________________*",
					"varname" : "lastLine"
				}

			}
, 			{
				"box" : 				{
					"fontsize" : 10.0,
					"id" : "obj-5",
					"linecount" : 2,
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 68.5, 1140.0, 231.0, 31.0 ],
					"presentation_linecount" : 2,
					"text" : ";\rmax launchbrowser http://tecartlab.com/feedback/"
				}

			}
, 			{
				"box" : 				{
					"align" : 0,
					"bgcolor" : [ 0.011765, 0.396078, 0.752941, 1.0 ],
					"hint" : "opens link inside webbrowser",
					"id" : "obj-7",
					"maxclass" : "textbutton",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "int" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 68.5, 1115.0, 261.0, 20.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 144.0, 1070.0, 168.0, 23.0 ],
					"rounded" : 10.0,
					"text" : "http://tecartlab.com/feedback/",
					"textcolor" : [ 1.0, 1.0, 1.0, 1.0 ],
					"textjustification" : 0,
					"textoncolor" : [ 1.0, 1.0, 1.0, 1.0 ],
					"textovercolor" : [ 1.0, 1.0, 1.0, 1.0 ]
				}

			}
 ],
		"lines" : [ 			{
				"patchline" : 				{
					"destination" : [ "obj-36", 0 ],
					"hidden" : 1,
					"source" : [ "obj-28", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-36", 1 ],
					"hidden" : 1,
					"source" : [ "obj-30", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-24", 0 ],
					"hidden" : 1,
					"source" : [ "obj-36", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-34", 0 ],
					"hidden" : 1,
					"source" : [ "obj-36", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-5", 0 ],
					"source" : [ "obj-7", 0 ]
				}

			}
 ],
		"dependency_cache" : [ 			{
				"name" : "RenderGroupCell_capture_C.png",
				"bootpath" : "/Volumes/Ddrive/00_core/MaxMSP_Packages/Sparck2/media",
				"patcherrelativepath" : "../../../media",
				"type" : "PNG",
				"implicit" : 1
			}
, 			{
				"name" : "bs.gui.svg.button.maxpat",
				"bootpath" : "/Volumes/Ddrive/00_core/MaxMSP_Packages/Sparck2/patchers/gui",
				"patcherrelativepath" : "../../gui",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "bs.help.node.head.js",
				"bootpath" : "/Volumes/Ddrive/00_core/MaxMSP_Packages/Sparck2/javascript/help",
				"patcherrelativepath" : "../../../javascript/help",
				"type" : "TEXT",
				"implicit" : 1
			}
, 			{
				"name" : "bs.help.node.links.js",
				"bootpath" : "/Volumes/Ddrive/00_core/MaxMSP_Packages/Sparck2/javascript/help",
				"patcherrelativepath" : "../../../javascript/help",
				"type" : "TEXT",
				"implicit" : 1
			}
, 			{
				"name" : "bs.help.node.notes.js",
				"bootpath" : "/Volumes/Ddrive/00_core/MaxMSP_Packages/Sparck2/javascript/help",
				"patcherrelativepath" : "../../../javascript/help",
				"type" : "TEXT",
				"implicit" : 1
			}
, 			{
				"name" : "bs.help.node.reference.js",
				"bootpath" : "/Volumes/Ddrive/00_core/MaxMSP_Packages/Sparck2/javascript/help",
				"patcherrelativepath" : "../../../javascript/help",
				"type" : "TEXT",
				"implicit" : 1
			}
, 			{
				"name" : "bs.help.util.getpos.js",
				"bootpath" : "/Volumes/Ddrive/00_core/MaxMSP_Packages/Sparck2/javascript/help",
				"patcherrelativepath" : "../../../javascript/help",
				"type" : "TEXT",
				"implicit" : 1
			}
, 			{
				"name" : "bs.help.util.node.head.maxpat",
				"bootpath" : "/Volumes/Ddrive/00_core/MaxMSP_Packages/Sparck2/patchers/help/util",
				"patcherrelativepath" : "../util",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "bs.help.util.node.links.maxpat",
				"bootpath" : "/Volumes/Ddrive/00_core/MaxMSP_Packages/Sparck2/patchers/help/util",
				"patcherrelativepath" : "../util",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "bs.help.util.node.textblock.maxpat",
				"bootpath" : "/Volumes/Ddrive/00_core/MaxMSP_Packages/Sparck2/patchers/help/util",
				"patcherrelativepath" : "../util",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "bs.help.util.ossia.reference.maxpat",
				"bootpath" : "/Volumes/Ddrive/00_core/MaxMSP_Packages/Sparck2/patchers/help/util",
				"patcherrelativepath" : "../util",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "bs.ossia.remote.color.maxpat",
				"bootpath" : "/Volumes/Ddrive/00_core/MaxMSP_Packages/Sparck2/patchers/ossia",
				"patcherrelativepath" : "../../ossia",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "bs.ossia.remote.float.maxpat",
				"bootpath" : "/Volumes/Ddrive/00_core/MaxMSP_Packages/Sparck2/patchers/ossia",
				"patcherrelativepath" : "../../ossia",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "bs.ossia.remote.js",
				"bootpath" : "/Volumes/Ddrive/00_core/MaxMSP_Packages/Sparck2/javascript/ossia",
				"patcherrelativepath" : "../../../javascript/ossia",
				"type" : "TEXT",
				"implicit" : 1
			}
, 			{
				"name" : "bs.ossia.remote.menu.maxpat",
				"bootpath" : "/Volumes/Ddrive/00_core/MaxMSP_Packages/Sparck2/patchers/ossia",
				"patcherrelativepath" : "../../ossia",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "bs.ossia.remote.playbar.maxpat",
				"bootpath" : "/Volumes/Ddrive/00_core/MaxMSP_Packages/Sparck2/patchers/ossia",
				"patcherrelativepath" : "../../ossia",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "bs.ossia.remote.rendergroup.maxpat",
				"bootpath" : "/Volumes/Ddrive/00_core/MaxMSP_Packages/Sparck2/patchers/ossia/rendergroup",
				"patcherrelativepath" : "../../ossia/rendergroup",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "bs.ossia.remote.tfm.local.maxpat",
				"bootpath" : "/Volumes/Ddrive/00_core/MaxMSP_Packages/Sparck2/patchers/ossia/transforms",
				"patcherrelativepath" : "../../ossia/transforms",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "bs.ossia.remote.toggle.maxpat",
				"bootpath" : "/Volumes/Ddrive/00_core/MaxMSP_Packages/Sparck2/patchers/ossia",
				"patcherrelativepath" : "../../ossia",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "bs.props.TfmNodePath.p.maxpat",
				"bootpath" : "/Volumes/Ddrive/00_core/MaxMSP_Packages/Sparck2/patchers/nodes/ossia",
				"patcherrelativepath" : "../../nodes/ossia",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "bs.vpl.node.pbody.js",
				"bootpath" : "/Volumes/Ddrive/00_core/MaxMSP_Packages/Sparck2/javascript/vpl",
				"patcherrelativepath" : "../../../javascript/vpl",
				"type" : "TEXT",
				"implicit" : 1
			}
, 			{
				"name" : "bs.vpl.node.pbody.maxpat",
				"bootpath" : "/Volumes/Ddrive/00_core/MaxMSP_Packages/Sparck2/patchers/vpl",
				"patcherrelativepath" : "../../vpl",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "icst.button.mxo",
				"type" : "iLaX"
			}
, 			{
				"name" : "icst.floatui.mxo",
				"type" : "iLaX"
			}
, 			{
				"name" : "mxj.mxo",
				"type" : "iLaX"
			}
, 			{
				"name" : "ossia.remote.mxo",
				"type" : "iLaX"
			}
, 			{
				"name" : "ossia.view.mxo",
				"type" : "iLaX"
			}
 ],
		"autosave" : 0,
		"styles" : [ 			{
				"name" : "AudioStatus_Menu",
				"default" : 				{
					"bgfillcolor" : 					{
						"angle" : 270.0,
						"autogradient" : 0,
						"color" : [ 0.294118, 0.313726, 0.337255, 1 ],
						"color1" : [ 0.454902, 0.462745, 0.482353, 0.0 ],
						"color2" : [ 0.290196, 0.309804, 0.301961, 1.0 ],
						"proportion" : 0.39,
						"type" : "color"
					}

				}
,
				"parentstyle" : "",
				"multi" : 0
			}
 ]
	}

}
