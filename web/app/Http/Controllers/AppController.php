<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Shopify\Utils;
use Shopify\Auth\OAuth;
use Shopify\Auth\Session as AuthSession;
use App\Models\Session;
use Illuminate\Support\Facades\Http;

class AppController extends Controller
{
    //
    public function index(Request $request){
        $value = array();
        $allOrdersMeta = array();
        $shop = Utils::sanitizeShopDomain($request->query('shop'));
        $session = Session::where('shop', $shop)->first();
        if ($session) {
            $accessToken = $session->access_token;
            $store_url = $session->shop;
        }
        // dd($accessToken);
        $headers = [
            'Content-Type' => 'application/json',
            'X-Shopify-Access-Token' => $accessToken,
        ];

        $api_url = "https://".trim($shop)."/admin/api/2023-10/orders.json?status=any";
        $updateMetaTagresponse = Http::withHeaders($headers)->get($api_url);
        $jsonUpdatemetaTagResponse = $updateMetaTagresponse->json();
        $metatag_res = $jsonUpdatemetaTagResponse;
        // dd(sizeof($metatag_res['orders']));
        for ($i = 0; $i <sizeof($metatag_res['orders']); $i++) {
            $metaFields = array();
            $id = $metatag_res['orders'][$i]['id'];    
            $api_url = "https://".trim($shop)."/admin/api/2023-10/orders/".$id."/metafields.json";
            $metaFieldHeader = Http::withHeaders($headers)->get($api_url);
            $jsonMetaField = $metaFieldHeader->json();
            array_push($metaFields, $jsonMetaField['metafields'], $id);
            array_push($allOrdersMeta, $metaFields);
        }
        for ($j = 0; $j <sizeof($allOrdersMeta); $j++) {
            if(empty($allOrdersMeta[$j][0])){
                $dateId = array();
                array_push($dateId,'No Date',$allOrdersMeta[$j][1]);
                array_push($value, $dateId);
            }
            else{
                for($i = 0; $i < sizeof($allOrdersMeta[$j][0]); $i++) {
                    if($allOrdersMeta[$j][0][$i]['key'] === 'requested_shipping_date'){
                        $dateId = array();
                        array_push($dateId,$allOrdersMeta[$j][0][$i]['value'],$allOrdersMeta[$j][1]);
                        array_push($value, $dateId);
                        // array_push($value, $allOrdersMeta[$j][0][$i]['value'],$allOrdersMeta[$j][1]);
                    }
                }
            }
        }
        $orderRes = $metatag_res['orders'];
        // dd($metatag_res);
        $url = explode('.',$store_url);
        $url = $url['0'];
        return view('welcome', compact('orderRes', 'value', 'url')); 
        // return
    }
}
