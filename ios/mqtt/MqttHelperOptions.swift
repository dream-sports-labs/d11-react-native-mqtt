//
//  MqttHelperOptions.swift
//  CocoaAsyncSocket
//
//  Created by Vibhor Verma on 31/10/23.
//

// import Foundation

import Foundation

class MqttHelperOptions {
    let username: String
    let password: String
    let keepAlive: UInt16
    let cleanSession: Bool
    
    init(_ options: [String: Any]) {
        username = options["username"] as? String ?? ""
        password = options["password"] as? String ?? ""
        keepAlive = UInt16(options["keepAlive"] as? Int ?? 60)
        cleanSession = options["cleanSession"] as? Bool ?? true
    }
}
