/*
 * Copyright (c) 2016 Juniper Networks, Inc. All rights reserved.
 */

define([
    'underscore',
    'contrail-model',
    'core-basedir/js/models/RBACPermsShareModel'
], function (_, ContrailModel, RBACPermsShareModel) {

    var contrailConfigModel = ContrailModel.extend({
        defaultConfig: {
            "perms2": {
                "owner": "",
                "owner_access": "",
                "global_access": "",
                "share": []
            },
            "tag_refs":[]
        },

        formatRBACPermsModelConfig: function(modelData) {
            modelData = (modelData == null) ? this.defaultConfig : modelData;
            var self = this, shareModel, shareModelCol = [],
            share;
            if(modelData["perms2"]) {
                modelData["perms2"]["owner_access"] =
                    self.formatAccessList(modelData["perms2"]["owner_access"]);
                modelData["perms2"]["global_access"] =
                    self.formatAccessList(modelData["perms2"]["global_access"]);
                modelData["owner_visible"] = true;
            } else {//required for create case
                modelData["perms2"] = {};
                modelData["perms2"]["owner_access"] = "4,2,1";
                modelData["perms2"]["global_access"] = "";
                modelData["owner_visible"] = false;
            }

            share = getValueByJsonPath(modelData,
                    "perms2;share", []);
            _.each(share, function(s){
                shareModel = new RBACPermsShareModel({
                    tenant : s.tenant,
                    tenant_access: self.formatAccessList(s.tenant_access)
                });
                shareModelCol.push(shareModel);
            });
            modelData["share_list"] =
                new Backbone.Collection(shareModelCol);
            var editApplicationRefs = [] , editagSiteRefs = [], editagDeploymentRefs = [], editagTierRefs = [];
            var editTagsRefsArray = [];
            var tagrefs = getValueByJsonPath(modelData,
                    "tag_refs", []);
            if(tagrefs.length > 0) {
                _.each(tagrefs, function(refs){
                    var fqName = refs.to;
                    if(fqName.length === 1){
                        if((fqName[0].indexOf('application') > -1)) {
                            editApplicationRefs.push(fqName[0]);
                            editTagsRefsArray.push(fqName[0]);
                        }
                        else if((fqName[0].indexOf('site') > -1)) {
                            editagSiteRefs.push(fqName[0]);
                            editTagsRefsArray.push(fqName[0]);
                        }
                        else if((fqName[0].indexOf('deployment') > -1)) {
                            editagDeploymentRefs.push(fqName[0]);
                            editTagsRefsArray.push(fqName[0]);
                        }
                        else if((fqName[0].indexOf('tier') > -1)) {
                            editagTierRefs.push(fqName[0]);
                            editTagsRefsArray.push(fqName[0]);
                        }
                    }
                    else if(fqName.length === 3){
                        if((fqName[2].indexOf('application') > -1)) {
                            editApplicationRefs.push(fqName[0] +
                            ":" + fqName[1] +
                            ":" + fqName[2]);
                            editTagsRefsArray.push(fqName[0] +
                                    ":" + fqName[1] +
                                    ":" + fqName[2]);
                        }
                        else if((fqName[2].indexOf('site') > -1)) {
                            editagSiteRefs.push(fqName[0] +
                            ":" + fqName[1] +
                            ":" + fqName[2]);
                            editTagsRefsArray.push(fqName[0] +
                                    ":" + fqName[1] +
                                    ":" + fqName[2]);
                        }
                        else if((fqName[2].indexOf('deployment') > -1)) {
                            editagDeploymentRefs.push(fqName[0] +
                            ":" + fqName[1] +
                            ":" + fqName[2]);
                            editTagsRefsArray.push(fqName[0] +
                                    ":" + fqName[1] +
                                    ":" + fqName[2]);
                        }
                        else if((fqName[2].indexOf('tier') > -1)) {
                            editagTierRefs.push(fqName[0] +
                            ":" + fqName[1] +
                            ":" + fqName[2]);
                            editTagsRefsArray.push(fqName[0] +
                                    ":" + fqName[1] +
                                    ":" + fqName[2]);
                        }
                    }
                });
            }
            console.log("editTagsRefsArray");
            console.log(editTagsRefsArray);
            modelData["tag_refs"] = editTagsRefsArray;
            modelData["Application"] = editApplicationRefs;
            modelData["Site"] = editagSiteRefs;
            modelData["Deployment"] = editagDeploymentRefs;
            modelData["Tier"] = editagTierRefs;
            //editagApplicationRefs , editagSiteRefs, editagDeploymentRefs, editagTierRefs;
            return modelData;
        },

        formatAccessList: function(access) {
            var retStr = "";
            switch (access) {
                case 1:
                    retStr = "1";
                    break;
                case 2:
                    retStr = "2";
                    break;
                case 3:
                    retStr = "2,1";
                    break;
                case 4:
                    retStr = "4";
                    break;
                case 5:
                    retStr = "4,1";
                    break;
                case 6:
                    retStr = "4,2";
                    break;
                case 7:
                    retStr = "4,2,1";
                    break;
                default:
                    retStr = "";
                    break;
            };
            return retStr;
        },

        addShare: function() {
            var share =
                this.model().attributes["share_list"];
            if(share && share.add instanceof Function) {
                share.add([new RBACPermsShareModel()]);
            }
        },
        addShareByIndex: function(data, kbInterface) {
            var selectedRuleIndex = data.model().collection.indexOf(kbInterface.model());
            var share =
                this.model().attributes["share_list"];
            if(share && share.add instanceof Function) {
                share.add([new RBACPermsShareModel()],{at: selectedRuleIndex+1});
            }
        },
        deleteShare: function(data, kbInterface) {
            data.model().collection.remove(kbInterface.model())
        },

        updateRBACPermsAttrs: function(cfgObj) {
            var self = this;
            if(cfgObj && cfgObj["perms2"]) {
                cfgObj["perms2"]["owner_access"] = self.getConsolidatedNumber(
                        cfgObj["perms2"]["owner_access"]);
                cfgObj["perms2"]["global_access"] = self.getConsolidatedNumber(
                        cfgObj["perms2"]["global_access"]);
                cfgObj["perms2"]["share"] = self.getShare(cfgObj);
                delete cfgObj.share_list;
                delete cfgObj.owner_visible;
            }
            //tags
            tagList = [];
            if(cfgObj.Application && cfgObj.Application != "None"){
                tagList.push({to: cfgObj.Application.split(':')});
            }
            if(cfgObj.Site && cfgObj.Site != "None"){
                tagList.push({to: cfgObj.Site.split(':')});
            }
            if(cfgObj.Deployment && cfgObj.Deployment != "None"){
                tagList.push({to: cfgObj.Deployment.split(':')});
            }
            if(cfgObj.Tier && cfgObj.Tier != "None"){
                tagList.push({to: cfgObj.Tier.split(':')});
            }            
            cfgObj.tag_refs = tagList;
        },

        getConsolidatedNumber: function(access) {
            var accessArry = access ? access.toString().split(",") : [],
                resValue = 0;
            _.each(accessArry, function(a){
                resValue += Number(a);
            });
            return resValue;
        },

        getShare: function(attr) {
            var self = this, share =
                attr && attr.share_list ?
                        attr.share_list.toJSON() : [],
                actShare = [];
            _.each(share, function(r){
                var tenantId,
                    tenantIdArry = r.tenant() ?
                        r.tenant().toString().split(" (") : [];
                tenantId = tenantIdArry.length === 2 ?
                    tenantIdArry[1].toString().replace(")","") : r.tenant();
                actShare.push({
                    tenant: tenantId,
                    tenant_access: self.getConsolidatedNumber(r.tenant_access())
                });
            });
            return actShare;
        },
    });

    return contrailConfigModel;
});
